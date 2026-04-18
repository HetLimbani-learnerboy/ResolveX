from flask import Blueprint, request, jsonify
from models.user_model import check_email_exists
import bcrypt

login_bp = Blueprint("login_bp", __name__)

def verify_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

@login_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data["email"]
    password = data["password"]

    user = check_email_exists(email)

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not verify_password(password, user[3]):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": str(user[0]),
            "full_name": user[1],
            "email": user[2],
            "role": user[4],
            "is_verified": user[5]
        }
    })