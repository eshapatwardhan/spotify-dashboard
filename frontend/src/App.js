import { useState, useEffect, useRef } from "react";
import axios from "axios";

const SOUL_CARDS = {
  "The Sun": "/cards/2.png",
  "The Moon": "/cards/3.png",
  "The Star": "/cards/4.png",
  "The Chariot": "/cards/5.png",
  "The Hermit": "/cards/6.png",
};

const ENERGY_CARDS = {
  high: "/cards/7.png",
  medium: "/cards/8.png",
  low: "/cards/9.png",
};

const MOOD_CARDS = {
  happy: "/cards/10.png",
  melancholy: "/cards/11.png",
  balanced: "/cards/12.png",
};

const SHADOW_CARD = "/cards/13.png";
const CARD_BACK = "/cards/1.png";

const CONSTELLATIONS = {
  "The Chariot": {
    name: "Orion",
    stars: [
      { x: 0.35, y: 0.15 },
      { x: 0.65, y: 0.18 },
      { x: 0.28, y: 0.48 },
      { x: 0.50, y: 0.50 },
      { x: 0.72, y: 0.52 },
      { x: 0.38, y: 0.82 },
      { x: 0.68, y: 0.80 },
      { x: 0.50, y: 0.32 },
      { x: 0.50, y: 0.65 },
    ],
    lines: [[0,1],[0,2],[1,5],[0,7],[1,7],[2,3],[3,4],[2,8],[4,8],[5,6],[5,8],[6,8]],
  },
  "The Moon": {
    name: "Cassiopeia",
    stars: [
      { x: 0.10, y: 0.55 },
      { x: 0.28, y: 0.25 },
      { x: 0.50, y: 0.45 },
      { x: 0.72, y: 0.20 },
      { x: 0.90, y: 0.50 },
      { x: 0.50, y: 0.72 },
      { x: 0.20, y: 0.80 },
      { x: 0.80, y: 0.75 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[0,6],[4,7],[1,5],[3,5]],
  },
  "The Sun": {
    name: "Corona Borealis",
    stars: [
      { x: 0.50, y: 0.15 },
      { x: 0.70, y: 0.22 },
      { x: 0.85, y: 0.40 },
      { x: 0.82, y: 0.62 },
      { x: 0.65, y: 0.75 },
      { x: 0.50, y: 0.80 },
      { x: 0.35, y: 0.75 },
      { x: 0.18, y: 0.62 },
      { x: 0.15, y: 0.40 },
      { x: 0.30, y: 0.22 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]],
  },
  "The Hermit": {
    name: "Ursa Minor",
    stars: [
      { x: 0.50, y: 0.12 },
      { x: 0.45, y: 0.30 },
      { x: 0.55, y: 0.45 },
      { x: 0.40, y: 0.58 },
      { x: 0.28, y: 0.65 },
      { x: 0.20, y: 0.78 },
      { x: 0.35, y: 0.82 },
      { x: 0.50, y: 0.75 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,3]],
  },
  "The Star": {
    name: "Lyra",
    stars: [
      { x: 0.50, y: 0.10 },
      { x: 0.35, y: 0.38 },
      { x: 0.65, y: 0.38 },
      { x: 0.30, y: 0.62 },
      { x: 0.70, y: 0.62 },
      { x: 0.35, y: 0.82 },
      { x: 0.65, y: 0.82 },
      { x: 0.50, y: 0.50 },
    ],
    lines: [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,6],[5,6],[1,7],[2,7]],
  },
};

const SOUL_READINGS = {
  "The Chariot": (artist) => `${artist} leads your musical soul. You are driven and unstoppable — your music is not background noise, it is the engine of your life.`,
  "The Moon": (artist) => `${artist} speaks to your depths. You find beauty between light and shadow, drawn to music that holds space for what cannot be said.`,
  "The Sun": (artist) => `${artist} illuminates your path. Your music radiates warmth and possibility — you lift every room you enter.`,
  "The Hermit": (artist) => `${artist} guides your inner world. You seek music that creates sanctuary, preferring depth and atmosphere over noise.`,
  "The Star": (artist) => `${artist} reflects your infinite range. Your taste cannot be confined to a single definition — you contain multitudes.`,
};

const getEnergyReading = (key, artists) => {
  const mention = artists.slice(0, 2).map(a => a.name).join(" and ");
  const readings = {
    high: `Artists like ${mention} fuel your high-energy listening. You are drawn to music that moves your body before your mind catches up — sound is your adrenaline.`,
    medium: `${mention} reflect your balance of stillness and momentum. Your music knows when to push forward and when to breathe.`,
    low: `The quiet intensity of artists like ${mention} speaks to you. You seek music that creates space — your power lies in depth, not velocity.`,
  };
  return readings[key];
};

const getMoodReading = (key, artists) => {
  const mention = artists.slice(3, 6).map(a => a.name).join(", ");
  const readings = {
    happy: `${mention} point to a listener who leans toward light. You use music to lift yourself and others — your playlists open rooms rather than close them.`,
    melancholy: `The presence of ${mention} in your top artists reveals someone who finds meaning in the bittersweet. Your music holds what words cannot contain.`,
    balanced: `${mention} show a listener who lives between joy and longing. Your music reflects the full complexity of being human — never just one thing.`,
  };
  return readings[key];
};

function TarotCard({ frontImage, title, reading, flipped, onClick }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        onClick={onClick}
        style={{ cursor: "pointer", perspective: "1200px", width: "240px", height: "390px", display: "inline-block" }}
      >
        <div style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}>
          <div style={{
            position: "absolute", width: "100%", height: "100%",
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            borderRadius: "18px", overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <img src={CARD_BACK} alt="card back" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{
            position: "absolute", width: "100%", height: "100%",
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "18px", overflow: "hidden",
            boxShadow: flipped ? "0 0 40px rgba(212,175,55,0.35), 0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <img src={frontImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </div>
      </div>
      {flipped && (
        <p style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: "#D4AF37",
          marginTop: "18px",
          marginBottom: "12px",
          letterSpacing: "1px",
          fontFamily: "Georgia, serif",
        }}>
          {title.toUpperCase()}
        </p>
      )}
      {flipped && (
        <p style={{
          maxWidth: "250px",
          margin: "0 auto",
          color: "#ddd",
          fontSize: "15px",
          lineHeight: "1.7",
          fontStyle: "italic",
        }}>
          {reading}
        </p>
      )}
    </div>
  );
}

function ConstellationMap({ artists, archetype }) {
  const canvasRef = useRef(null);
  const constellation = CONSTELLATIONS[archetype] || CONSTELLATIONS["The Star"];
  const W = 500, H = 420;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || artists.length === 0) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const stars = constellation.stars.map(s => ({ x: s.x * W, y: s.y * H }));

    ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 1;
    constellation.lines.forEach(([a, b]) => {
      if (!stars[a] || !stars[b]) return;
      ctx.beginPath();
      ctx.moveTo(stars[a].x, stars[a].y);
      ctx.lineTo(stars[b].x, stars[b].y);
      ctx.stroke();
    });

    stars.forEach((star, i) => {
      const artist = artists[i];
      if (!artist) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212,175,55,0.4)";
        ctx.fill();
        return;
      }
      const radius = i === 0 ? 28 : 18;
      if (artist.image) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = artist.image;
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, star.x - radius, star.y - radius, radius * 2, radius * 2);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = i === 0 ? "#D4AF37" : "rgba(212,175,55,0.5)";
          ctx.lineWidth = i === 0 ? 2 : 1;
          ctx.stroke();
          if (i === 0) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(212,175,55,0.15)";
            ctx.lineWidth = 6;
            ctx.stroke();
          }
          ctx.fillStyle = i === 0 ? "#D4AF37" : "rgba(200,180,140,0.7)";
          ctx.font = i === 0 ? "bold 11px Georgia" : "10px Georgia";
          ctx.textAlign = "center";
          ctx.fillText(artist.name, star.x, star.y + radius + 14);
        };
      } else {
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212,175,55,0.2)";
        ctx.fill();
        ctx.strokeStyle = "rgba(212,175,55,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#D4AF37";
        ctx.font = "10px Georgia";
        ctx.textAlign = "center";
        ctx.fillText(artist.name, star.x, star.y + radius + 14);
      }
    });
  }, [artists, archetype, constellation]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
    />
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "10px", color: "#666", letterSpacing: "2px", fontFamily: "Georgia, serif" }}>
          {label.toUpperCase()}
        </span>
        <span style={{ fontSize: "10px", color }}>{value}%</span>
      </div>
      <div style={{ background: "#111", borderRadius: "3px", height: "3px" }}>
        <div style={{ background: color, width: `${value}%`, height: "3px", borderRadius: "3px", transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

export default function App() {
  const [artists, setArtists] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState({ soul: false, energy: false, mood: false, shadow: false });
  const [showConstellation, setShowConstellation] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      : { withCredentials: true };

    setLoading(true);
    axios.get("https://spotify-dashboard-tz77.onrender.com/api/top-artists", config)
      .then(r => { setArtists(r.data); setLoggedIn(true); })
      .catch(() => setLoggedIn(false));
    axios.get("https://spotify-dashboard-tz77.onrender.com/api/soul-profile", config)
      .then(r => { setProfile(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleCard = (card) => setFlipped(prev => ({ ...prev, [card]: !prev[card] }));

  if (!loggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "0 20px" }}>
          <p style={{ color: "#D4AF37", letterSpacing: "5px", fontSize: "10px", marginBottom: "20px", fontFamily: "Georgia, serif" }}>
            ✦ MUSICAL TAROT ✦
          </p>
          <h1 style={{ color: "#fff", fontSize: "38px", fontWeight: "300", marginBottom: "12px", fontFamily: "Georgia, serif" }}>
            Your Spotify Soul Reading
          </h1>
          <p style={{ color: "#444", marginBottom: "48px", fontSize: "14px", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            Discover what your music says about you
          </p>
          <button
            onClick={() => window.location.href = "https://spotify-dashboard-tz77.onrender.com/login"}
            style={{ padding: "14px 36px", background: "#1DB954", color: "white", border: "none", borderRadius: "30px", fontSize: "14px", cursor: "pointer", letterSpacing: "1px", fontFamily: "Georgia, serif" }}>
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#D4AF37", letterSpacing: "4px", fontSize: "11px", fontFamily: "Georgia, serif" }}>✦ READING THE CARDS... ✦</p>
      </div>
    );
  }

  const soulImage = profile ? (SOUL_CARDS[profile.archetype] || SOUL_CARDS["The Star"]) : SOUL_CARDS["The Star"];
  const energyKey = profile ? (profile.scores.energy > 50 ? "high" : profile.scores.energy > 25 ? "medium" : "low") : "medium";
  const moodKey = profile ? (profile.scores.melancholy > profile.scores.happy ? "melancholy" : profile.scores.happy > profile.scores.melancholy ? "happy" : "balanced") : "balanced";
  const energyReading = getEnergyReading(energyKey, artists);
  const moodReading = getMoodReading(moodKey, artists);
  const soulReading = profile ? (SOUL_READINGS[profile.archetype] || SOUL_READINGS["The Star"])(profile.top_artist) : "";
  const shadowArtist = artists.length > 0 ? artists[artists.length - 1].name : "an unexpected muse";
  const topArtist = artists[0];
  const constellation = CONSTELLATIONS[profile?.archetype] || CONSTELLATIONS["The Star"];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "60px 20px 48px" }}>
        <p style={{ color: "#D4AF37", letterSpacing: "5px", fontSize: "10px", margin: "0 0 16px" }}>✦ MUSICAL TAROT ✦</p>
        <h1 style={{ fontSize: "34px", fontWeight: "300", margin: "0 0 10px" }}>Your Spotify Soul Reading</h1>
        {profile && (
          <h2 style={{
            color: "#D4AF37",
            fontSize: "42px",
            fontWeight: "400",
            margin: "16px 0 0",
            letterSpacing: "2px",
            fontFamily: "Georgia, serif",
            textTransform: "uppercase",
          }}>
            {profile.archetype}
          </h2>
        )}
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>

        {/* Tarot Cards */}
        <p style={{ fontSize: "9px", color: "#333", letterSpacing: "3px", textAlign: "center", marginBottom: "32px" }}>
          TAP EACH CARD TO REVEAL YOUR READING
        </p>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center", marginBottom: "80px" }}>
          <TarotCard frontImage={soulImage} title="The Soul" reading={soulReading} flipped={flipped.soul} onClick={() => toggleCard("soul")} />
          <TarotCard frontImage={ENERGY_CARDS[energyKey]} title="The Energy" reading={energyReading} flipped={flipped.energy} onClick={() => toggleCard("energy")} />
          <TarotCard frontImage={MOOD_CARDS[moodKey]} title="The Mood" reading={moodReading} flipped={flipped.mood} onClick={() => toggleCard("mood")} />
          <TarotCard
            frontImage={SHADOW_CARD}
            title="The Shadow"
            reading={`${shadowArtist} lurks in your shadow — an artist that reveals a side of you still being discovered.`}
            flipped={flipped.shadow}
            onClick={() => toggleCard("shadow")}
          />
        </div>

        {/* North Star + Constellation */}
        {topArtist && (
          <div style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "34px", color: "#D4AF37", fontWeight: "300", textAlign: "center", marginBottom: "8px" }}>
              Your Musical North Star
            </h2>
            {!showConstellation && (
              <p style={{ color: "#555", fontStyle: "italic", textAlign: "center", marginBottom: "32px", fontSize: "13px" }}>
                Click to discover your constellation ✦
              </p>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "60px", flexWrap: "wrap" }}>

              {/* Artist photo — always visible */}
              <div
                onClick={() => setShowConstellation(!showConstellation)}
                style={{ cursor: "pointer", textAlign: "center", flexShrink: 0 }}
              >
                {topArtist.image && (
                  <div style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: showConstellation ? "3px solid #D4AF37" : "3px solid #D4AF37",
                    margin: "0 auto 16px",
                    boxShadow: showConstellation
                      ? "0 0 60px rgba(212,175,55,0.5)"
                      : "0 0 40px rgba(212,175,55,0.3)",
                    transition: "box-shadow 0.5s ease",
                  }}>
                    <img src={topArtist.image} alt={topArtist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <h3 style={{ fontSize: "24px", fontWeight: "300", marginBottom: "6px" }}>{topArtist.name}</h3>
                <p style={{ color: "#555", fontStyle: "italic", fontSize: "13px" }}>
                  {showConstellation ? "✦ click to close" : "guiding your musical universe"}
                </p>
              </div>

              {/* Constellation — slides in next to photo */}
              {showConstellation && (
                <div style={{ animation: "fadeIn 0.8s ease forwards" }}>
                  <h2 style={{ color: "#D4AF37", fontSize: "28px", fontWeight: "300", marginBottom: "4px", textAlign: "center" }}>
                    Your Constellation
                  </h2>
                  <p style={{ fontSize: "13px", color: "#555", textAlign: "center", fontStyle: "italic", marginBottom: "20px" }}>
                    {constellation.name}
                  </p>
                  <ConstellationMap artists={artists} archetype={profile?.archetype || "The Star"} />
                </div>
              )}

            </div>
          </div>
        )}

        {/* Score Bars */}
        {profile && (
          <div style={{ maxWidth: "500px", margin: "0 auto 80px", padding: "36px" }}>
            <p style={{ fontSize: "9px", color: "#333", letterSpacing: "3px", marginBottom: "28px", textAlign: "center" }}>
              YOUR MUSICAL ESSENCE
            </p>
            <ScoreBar label="Energy" value={profile.scores.energy} color="#C9A96E" />
            <ScoreBar label="Chill" value={profile.scores.chill} color="#A8B5A2" />
            <ScoreBar label="Happy" value={profile.scores.happy} color="#D4A99A" />
            <ScoreBar label="Melancholy" value={profile.scores.melancholy} color="#9E8FA3" />
          </div>
        )}

      </div>
    </div>
  );
}