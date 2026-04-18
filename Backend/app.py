from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({
        "message": "Flask Backend Running Successfully"
    })

@app.route("/api/test")
def test():
    return jsonify({
        "status": True,
        "message": "API Working Fine"
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)