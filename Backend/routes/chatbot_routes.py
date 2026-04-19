from flask import Blueprint, request, jsonify

# Absolute import from your services folder
from services.groq_service import (
    chat_with_context,
    clear_chat_session,
    get_ai_suggestion
)

# Blueprint definition with a clean prefix
chatbot_bp = Blueprint("chatbot_bp", __name__)

# ==========================================
# 1. SEND CHAT MESSAGE
# POST /api/chat/message
# ==========================================
@chatbot_bp.route("/message", methods=["POST"])
def chatbot_message():
    """
    Handles the floating chatbot logic.
    Matches Frontend URL: /api/chat/message
    """
    data = request.get_json(silent=True) or {}

    user_msg = data.get("message", "").strip()
    session_id = data.get("session_id", "default")
    context = data.get("context", {}) # Passes subject/category/original_text

    if not user_msg:
        return jsonify({
            "error": "No message provided"
        }), 400

    try:
        reply = chat_with_context(session_id, user_msg, context)

        return jsonify({
            "reply": reply,
            "session_id": session_id
        }), 200

    except Exception as e:
        print(f"❌ Chatbot Error: {e}")
        return jsonify({
            "error": "The AI is currently processing other requests. Please try again."
        }), 500


# ==========================================
# 2. ANALYZE COMPLAINT (AI Suggestion)
# POST /api/chat/analyze
# ==========================================
@chatbot_bp.route("/analyze", methods=["POST"])
def chatbot_analyze():
    """
    Handles the 'Get AI Suggestion' button inside the complaint form.
    Matches Frontend URL: /api/chat/analyze
    """
    data = request.get_json(silent=True) or {}

    subject = data.get("subject", "").strip()
    category = data.get("category", "").strip()
    complaint_text = data.get("complaint_text", "").strip()

    if not complaint_text:
        return jsonify({
            "error": "Please provide complaint details for analysis."
        }), 400

    try:
        result = get_ai_suggestion(subject, category, complaint_text)

        return jsonify({
            "suggestion": result # Frontend looks for 'suggestion' or 'analysis'
        }), 200

    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        return jsonify({
            "error": "Failed to generate AI suggestion."
        }), 500


# ==========================================
# 3. CLEAR SESSION
# DELETE /api/chat/clear/<session_id>
# ==========================================
@chatbot_bp.route("/clear/<session_id>", methods=["DELETE"])
def chatbot_clear(session_id):
    """
    Clears the sliding window memory for a specific user.
    """
    removed = clear_chat_session(session_id)

    return jsonify({
        "success": removed,
        "message": "Chat memory cleared" if removed else "No active session found"
    }), 200


# ==========================================
# 4. API STATUS (Health Check)
# GET /api/chat/test
# ==========================================
@chatbot_bp.route("/test", methods=["GET"])
def chatbot_test():
    return jsonify({
        "status": "online",
        "service": "ResolveX Groq AI Assistant"
    }), 200