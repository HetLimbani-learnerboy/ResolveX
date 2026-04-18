# ==========================================
# routes/user_routes.py
# ==========================================

from flask import Blueprint, request, jsonify
from models.user_model import insert_user

user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/create-user", methods=["POST"])
def create_user():
    data = request.json

    full_name = data["full_name"]
    email = data["email"]
    password_hash = data["password_hash"]
    role = data.get("role", "executive")
    phone = data.get("phone", "")
    is_verified = data.get("is_verified", True)

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