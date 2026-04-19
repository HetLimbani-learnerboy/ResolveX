import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import Model Table Creators
from models.user_model import create_user_table
from models.customer_model import create_customer_table
from models.complaint_model import create_complaint_table
from models.history_model import create_history_table
from models.feedback_model import create_feedback_table

# Import Blueprints
from routes.auth_routes import login_bp
from routes.user_routes import user_bp
from routes.ai_routes import ai_bp
from routes.admin_routes import admin_bp
from routes.feedback_routes import feedback_bp
from routes.customerse_api import customerse_api # Fixed naming consistency
from routes.chatbot_routes import chatbot_bp # Added chatbot blueprint import

# Import Dynamic Blueprints
try:
    from routes.chat_routes import chat_bp
    has_chat = True
except ImportError:
    has_chat = False

try:
    from routes.complaint_routes import complaint_bp
    has_complaint = True
except ImportError:
    has_complaint = False

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enhanced CORS: Allows React (usually port 5173 or 3000) to communicate with Flask
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==========================================
# DATABASE INITIALIZATION
# ==========================================
def init_db():
    with app.app_context():
        try:
            create_user_table()
            create_customer_table()
            create_complaint_table()
            create_history_table()
            create_feedback_table()
            print("[SUCCESS] Database tables initialized successfully.")
        except Exception as e:
            print(f"[ERROR] Database Init Error: {e}")
            print("Ensure PostgreSQL is running and your .env DATABASE_URL is correct.")

# Run DB init
init_db()

# ==========================================
# ROUTE REGISTRATION (Blueprints)
# ==========================================
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(login_bp, url_prefix="/api/auth")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
app.register_blueprint(customerse_api, url_prefix="/api/customerse")
app.register_blueprint(chatbot_bp,url_prefix="/api")  # Register chatbot routes with their own prefix


# Standardized chat prefix to /api/chat to match frontend
if has_chat:
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    
if has_complaint:
    app.register_blueprint(complaint_bp, url_prefix="/api/complaints")


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