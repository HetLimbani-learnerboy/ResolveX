# ==========================================
# routes/user_routes.py
# ==========================================

from flask import Blueprint, request, jsonify
from models.user_model import insert_user, check_email_exists
import bcrypt

user_bp = Blueprint("user_bp", __name__)


def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


@user_bp.route("/create-user", methods=["POST"])
def create_user():
    data = request.json

    full_name = data["full_name"]
    email = data["email"]
    password = data["password_hash"]
    role = data.get("role", "executive")
    phone = data.get("phone", "")
    is_verified = data.get("is_verified", True)

    # Check email already exists
    if check_email_exists(email):
        return jsonify({
            "message": "Email already exists"
        }), 400

    # Hash password
    password_hash = hash_password(password)

    user = insert_user(
        full_name,
        email,
        password_hash,
        role,
        phone,
        is_verified
    )

    return jsonify({
        "message": "User Created Successfully",
        "user": {
            "id": str(user[0]),
            "full_name": user[1],
            "email": user[2],
            "role": user[3],
            "is_verified": user[4]
        }
    })