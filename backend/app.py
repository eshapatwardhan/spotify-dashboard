from flask import Flask, redirect, request, jsonify, session
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS
import pandas as pd
import os
from dotenv import load_dotenv
import requests as http_requests

load_dotenv(override=False)

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True, origins=["https://spotify-dashboard-six-gilt.vercel.app"])
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_DOMAIN=None,
    SESSION_COOKIE_HTTPONLY=True,
)


SCOPE = "user-top-read user-read-recently-played"

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
    redirect_uri="https://spotify-dashboard-tz77.onrender.com/callback",
    scope=SCOPE,
)


@app.route("/login")
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route("/callback")
def callback():
    code = request.args.get("code")
    token_info = sp_oauth.get_access_token(code)
    token = token_info["access_token"]
    return redirect(f"https://spotify-dashboard-six-gilt.vercel.app?token={token}")
def get_sp():
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return spotipy.Spotify(auth=token)
    return spotipy.Spotify(auth=session.get("token"))

@app.route("/debug")
def debug():
    return jsonify({
        "client_id": os.getenv("SPOTIFY_CLIENT_ID", "NOT FOUND"),
        "has_secret": bool(os.getenv("SPOTIFY_CLIENT_SECRET")),
        "has_lastfm": bool(os.getenv("LASTFM_API_KEY")),
    })

@app.route("/api/top-artists")
def top_artists():
    sp = get_sp()
    results = sp.current_user_top_artists(limit=20, time_range="medium_term")
    artists = [
    {
        "name": a.get("name", ""),
        "genres": a.get("genres", []),
        "popularity": a.get("popularity", 0),
        "image": a["images"][0]["url"] if a.get("images") else None,
    }
    for a in results["items"]
]
    return jsonify(artists)


@app.route("/api/top-tracks")
def top_tracks():
    sp = get_sp()
    results = sp.current_user_top_tracks(limit=20, time_range="medium_term")
    tracks = [
        {
            "name": t.get("name", ""),
            "artist": t["artists"][0]["name"] if t.get("artists") else "",
            "popularity": t.get("popularity", 0),
            "preview_url": t.get("preview_url"),
        }
        for t in results["items"]
    ]
    return jsonify(tracks)


@app.route("/api/recent-tracks")
def recent_tracks():
    sp = get_sp()
    results = sp.current_user_recently_played(limit=50)
    tracks = [
        {
            "name": t["track"]["name"],
            "artist": t["track"]["artists"][0]["name"],
            "played_at": t["played_at"],
            "duration_ms": t["track"]["duration_ms"],
        }
        for t in results["items"]
    ]
    return jsonify(tracks)


@app.route("/api/genre-breakdown")
def genre_breakdown():
    sp = get_sp()
    results = sp.current_user_top_artists(limit=50, time_range="medium_term")
    print("Total artists:", len(results["items"]))
    for artist in results["items"]:
        print(artist.get("name"), "->", artist.get("genres", []))
    genre_counts = {}
    for artist in results["items"]:
        for genre in artist.get("genres", []):
            genre_counts[genre] = genre_counts.get(genre, 0) + 1
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{"genre": g, "count": c} for g, c in sorted_genres[:20]])


@app.route("/api/audio-features")
def audio_features():
    sp = get_sp()
    top = sp.current_user_top_tracks(limit=50, time_range="medium_term")
    ids = [t["id"] for t in top["items"] if t.get("id")]
    features = sp.audio_features(ids)
    tracks = []
    for t, f in zip(top["items"], features):
        if f:
            tracks.append({
                "name": t.get("name", ""),
                "artist": t["artists"][0]["name"] if t.get("artists") else "",
                "valence": f.get("valence", 0),
                "energy": f.get("energy", 0),
                "danceability": f.get("danceability", 0),
                "tempo": f.get("tempo", 0),
            })
    return jsonify(tracks)


@app.route("/api/recommendations")
def recommendations():
    sp = get_sp()
    top = sp.current_user_top_artists(limit=5, time_range="medium_term")
    seed_ids = [a["id"] for a in top["items"][:3]]
    seed_names = [a["name"] for a in top["items"][:3]]
    recs = sp.recommendations(seed_artists=seed_ids, limit=20)
    
    # get unique artists from recommended tracks
    seen = set()
    artists = []
    for t in recs["tracks"]:
        artist = t["artists"][0]
        if artist["name"] not in seen and artist["name"] not in seed_names:
            seen.add(artist["name"])
            artists.append({
                "name": artist["name"],
                "track": t["name"],
                "preview_url": t.get("preview_url"),
                "spotify_url": t["external_urls"]["spotify"]
            })
    
    return jsonify({
        "seeds": seed_names,
        "artists": artists[:6]
    })
@app.route("/api/mood-tags")
def mood_tags():
    sp = get_sp()
    lastfm_key = os.getenv("LASTFM_API_KEY")
    
    # get top tracks
    results = sp.current_user_top_tracks(limit=20, time_range="medium_term")
    
    track_moods = []
    for t in results["items"]:
        track_name = t.get("name", "")
        artist_name = t["artists"][0]["name"] if t.get("artists") else ""
        
        # fetch tags from Last.fm
        response = http_requests.get("https://ws.audioscrobbler.com/2.0/", params={
            "method": "track.getTopTags",
            "artist": artist_name,
            "track": track_name,
            "api_key": lastfm_key,
            "format": "json",
            "limit": 5
        })
        
        data = response.json()
        tags = []
        if "toptags" in data and "tag" in data["toptags"]:
            tags = [tag["name"].lower() for tag in data["toptags"]["tag"][:5]]
        
        track_moods.append({
            "name": track_name,
            "artist": artist_name,
            "tags": tags
        })
    
    return jsonify(track_moods)

@app.route("/api/soul-profile")
def soul_profile():
    sp = get_sp()
    lastfm_key = os.getenv("LASTFM_API_KEY")
    
    results = sp.current_user_top_tracks(limit=20, time_range="medium_term")
    top_artists = sp.current_user_top_artists(limit=5, time_range="medium_term")
    
    # collect all tags
    all_tags = []
    for t in results["items"]:
        track_name = t.get("name", "")
        artist_name = t["artists"][0]["name"] if t.get("artists") else ""
        response = http_requests.get("https://ws.audioscrobbler.com/2.0/", params={
            "method": "track.getTopTags",
            "artist": artist_name,
            "track": track_name,
            "api_key": lastfm_key,
            "format": "json",
            "limit": 5
        })
        data = response.json()
        if "toptags" in data and "tag" in data["toptags"]:
            all_tags += [tag["name"].lower() for tag in data["toptags"]["tag"][:5]]
    
    # score each dimension
    energy_tags = ["dance", "energetic", "electronic", "drum and bass", "uptempo", "hip hop", "rap", "hip-hop", "reggaeton", "pop rap"]
    chill_tags = ["chill", "ambient", "acoustic", "slow", "ballad", "bossa nova", "bedroom pop", "soul"]
    happy_tags = ["happy", "love", "feel-good", "fun", "pop", "dance-pop", "pop rock"]
    melancholy_tags = ["sad", "melancholic", "melancholy", "emotional", "heartbreak", "indie", "alternative"]
    
    energy_score = sum(1 for t in all_tags if t in energy_tags)
    chill_score = sum(1 for t in all_tags if t in chill_tags)
    happy_score = sum(1 for t in all_tags if t in happy_tags)
    melancholy_score = sum(1 for t in all_tags if t in melancholy_tags)
    
    total = max(energy_score + chill_score + happy_score + melancholy_score, 1)
    
    energy = round((energy_score / total) * 100)
    chill = round((chill_score / total) * 100)
    happy = round((happy_score / total) * 100)
    melancholy = round((melancholy_score / total) * 100)
    
    # determine archetype
    if energy > 40:
        archetype = "The Chariot"
        archetype_desc = "You move through the world with unstoppable momentum. Your music is fuel."
    elif melancholy > 40:
        archetype = "The Moon"
        archetype_desc = "You find beauty in the bittersweet. Your music holds space for what can't be said."
    elif happy > 40:
        archetype = "The Sun"
        archetype_desc = "Your music radiates warmth. You lift every room you enter."
    elif chill > 40:
        archetype = "The Hermit"
        archetype_desc = "You seek depth over noise. Your music is a sanctuary."
    else:
        archetype = "The Star"
        archetype_desc = "You contain multitudes. Your taste defies a single definition."
    
    top_artist = top_artists["items"][0]["name"] if top_artists["items"] else "Unknown"
    
    return jsonify({
        "archetype": archetype,
        "archetype_desc": archetype_desc,
        "top_artist": top_artist,
        "scores": {
            "energy": energy,
            "chill": chill,
            "happy": happy,
            "melancholy": melancholy
        },
        "top_tags": list(set(all_tags))[:10]
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
