# ==========================================
# run.py
# ==========================================

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from models.user_model import create_user_table
from routes.user_routes import user_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

create_user_table()

app.register_blueprint(user_bp, url_prefix="/api/users")


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