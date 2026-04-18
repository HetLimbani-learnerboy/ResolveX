"""
routes/chat_routes.py
Blueprint: /api/chat/*
"""

from flask import Blueprint, request, jsonify
from services.gemini_service import chat_with_context

chat_bp = Blueprint("chat", __name__)


# ── POST /api/chat/message ───────────────────────────────────────────────────
@chat_bp.route("/message", methods=["POST"])
def message():
    """
    Multi-turn chat endpoint.

    Body:
        {
          "message":    "user's message",
          "session_id": "session_abc123",
          "context":    {                  ← optional, injected on first call
            "subject":        "...",
            "category":       "...",
            "complaint_text": "..."
          }
        }
    """
    data = request.get_json(force=True)

    user_message = (data.get("message") or "").strip()
    session_id = data.get("session_id") or "default"
    context = data.get("context")          # dict or None

    if not user_message:
        return jsonify({"error": "message is required."}), 400

    try:
        reply = chat_with_context(session_id, user_message, context)
        return jsonify({"reply": reply}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── DELETE /api/chat/session/<session_id> ────────────────────────────────────
@chat_bp.route("/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Clear a stored chat session (e.g. on page unload)."""
    from services.gemini_service import _sessions
    _sessions.pop(session_id, None)
    return jsonify({"deleted": session_id}), 200