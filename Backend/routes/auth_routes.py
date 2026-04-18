from flask import Blueprint, request, jsonify
from models.user_model import check_email_exists
import bcrypt
import jwt  # MUST BE PyJWT, not 'jwt'
from datetime import datetime, timedelta, timezone
import os

login_bp = Blueprint("login_bp", __name__)

def verify_password(password, password_hash):
    """Verifies a plain text password against a bcrypt hash."""
    if isinstance(password_hash, str):
        password_hash = password_hash.encode('utf-8')
    # Use bcrypt to check the password
    return bcrypt.checkpw(password.encode("utf-8"), password_hash)

@login_bp.route("/login", methods=["POST"])
def login():
    # Safely get JSON data
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"message": "Invalid JSON or empty body"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    # 1. Fetch user data
    # Expected SELECT: id, full_name, email, password_hash, role, phone, is_active, is_verified
    user = check_email_exists(email)

    # 2. Check if user exists (user is a tuple if found, None if not)
    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    # Database indices mapping
    db_password_hash = user[3]
    db_is_active = user[6]

    # 3. Verify Password
    try:
        if not verify_password(password, db_password_hash):
            return jsonify({"message": "Invalid email or password"}), 401
    except Exception:
        return jsonify({"message": "Error during password verification"}), 500

    # 4. Check if Account is Active
    if not db_is_active:
        return jsonify({"message": "Account is inactive"}), 403

    # 5. Generate Token
    # os.getenv returns None if the key isn't in .env; we provide a fallback for local dev
    secret_key = os.getenv("SECRET_KEY", "dev_secret_key_123")
    
    # Ensure all data in the payload is JSON serializable (str, int, etc.)
    payload = {
        "user_id": str(user[0]),  # Convert UUID to string
        "email": user[2],
        "role": user[4],
        "exp": datetime.now(timezone.utc) + timedelta(days=1)
    }

    try:
        # Generate the JWT string
        token = jwt.encode(payload, secret_key, algorithm="HS256")
    except AttributeError:
        return jsonify({
            "message": "Server Library Error: 'PyJWT' is not installed correctly. Run 'pip uninstall jwt python-jwt && pip install PyJWT'"
        }), 500

    # 6. Success Response
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user[0]),
            "full_name": user[1],
            "email": user[2],
            "role": user[4],
            "is_verified": user[7]
        }
    }), 200