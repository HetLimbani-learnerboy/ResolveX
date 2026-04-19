from flask import Blueprint, request, jsonify
# Absolute import is more stable in Flask
from services.groq_service import chat_with_context 

chat_bp = Blueprint("chat_bp", __name__)

@chat_bp.route("/message", methods=["POST"])
def message():
    """
    URL: http://localhost:5000/api/chat/message
    """
    # get_json(silent=True) prevents crashing if body is empty or malformed
    data = request.get_json(silent=True) or {}
    
    user_msg = data.get("message", "").strip()
    session_id = data.get("session_id", "default")
    context = data.get("context", {}) 

    if not user_msg:
        return jsonify({"error": "No message provided"}), 400

    try:
        reply = chat_with_context(session_id, user_msg, context)
        return jsonify({
            "reply": reply,
            "session_id": session_id
        }), 200
    except Exception as e:
        # Log the error for debugging
        print(f"❌ Chat Route Error: {e}")
        return jsonify({"error": "AI processing failed. Check backend logs."}), 500