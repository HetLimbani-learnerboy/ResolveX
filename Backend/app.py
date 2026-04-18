# ==========================================
# run.py
# ==========================================

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from models.user_model import create_user_table
from models.customer_model import create_customer_table
from models.complaint_model import create_complaint_table
from models.history_model import create_history_table
from models.feedback_model import create_feedback_table

from routes.auth_routes import login_bp
from routes.user_routes import user_bp
<<<<<<< HEAD
from routes.ai_routes import ai_bp
from routes.admin_routes import admin_bp
=======
from routes.chat_routes import chat_bp
from routes.complaint_routes import complaint_bp
>>>>>>> 8ced742e14fbe7f19b88bc762708a7ce7910cc7f

load_dotenv()

app = Flask(__name__)
CORS(app)

try:
    create_user_table()
    create_customer_table()
    create_complaint_table()
    create_history_table()
    create_feedback_table()
except Exception as e:
    print(f"Warning: Could not connect to Database on startup. Ensure PostgreSQL is running. Error: {e}")

app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(login_bp, url_prefix="/api/auth")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(login_bp, url_prefix="/api/auth")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
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