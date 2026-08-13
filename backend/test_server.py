from flask import Flask, jsonify, session
from flask_cors import CORS
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_DOMAIN=None,
    SESSION_COOKIE_HTTPONLY=True,
)

@app.route("/test")
def test():
    session["foo"] = "bar"
    return jsonify({"message": "it works"})

@app.route("/test-error")
def test_error():
    raise Exception("simulated error")
    
if __name__ == "__main__":
    app.run(port=5002, debug=True)