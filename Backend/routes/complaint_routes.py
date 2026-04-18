"""
routes/complaint_routes.py
Blueprint: /api/complaints/*
"""

from flask import Blueprint, request, jsonify
from models.complaint_model import insert_complaint, get_complaints_by_customer
from services.gemini_service import get_ai_suggestion

complaint_bp = Blueprint("complaints", __name__)


# ── POST /api/complaints/suggest ─────────────────────────────────────────────
@complaint_bp.route("/suggest", methods=["POST"])
def suggest():
    """
    Accepts form data and returns an AI-generated suggestion.
    Does NOT persist anything to the DB.
    """
    data = request.get_json(force=True)

    subject = (data.get("subject") or "").strip()
    category = (data.get("category") or "").strip()
    complaint_text = (data.get("complaint_text") or "").strip()

    if not subject or not category or not complaint_text:
        return jsonify({"error": "subject, category, and complaint_text are required."}), 400

    try:
        suggestion = get_ai_suggestion(subject, category, complaint_text)
        return jsonify({"suggestion": suggestion}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── POST /api/complaints/submit ──────────────────────────────────────────────
@complaint_bp.route("/submit", methods=["POST"])
def submit():
    """
    Persists a complaint to PostgreSQL.
    Optionally runs AI analysis to determine priority / recommended_action.
    """
    data = request.get_json(force=True)

    customer_id = data.get("customer_id")
    subject = (data.get("subject") or "").strip()
    category = (data.get("category") or "").strip()
    complaint_text = (data.get("complaint_text") or "").strip()

    if not subject or not category or not complaint_text:
        return jsonify({"error": "subject, category, and complaint_text are required."}), 400

    # Optional: run AI to determine priority
    priority = "Medium"
    recommended_action = None
    ai_confidence = None

    try:
        suggestion = get_ai_suggestion(subject, category, complaint_text)
        recommended_action = suggestion

        # Naive priority extraction from Gemini response
        text_lower = suggestion.lower()
        if "critical" in text_lower:
            priority = "Critical"
        elif "high" in text_lower:
            priority = "High"
        elif "low" in text_lower:
            priority = "Low"
        else:
            priority = "Medium"

        ai_confidence = 0.85
    except Exception:
        # Gemini failure is non-fatal; fall back to defaults
        pass

    try:
        ticket_id = insert_complaint(
            customer_id=customer_id,
            subject=subject,
            category=category,
            complaint_text=complaint_text,
            priority=priority,
            recommended_action=recommended_action,
            ai_confidence=ai_confidence,
        )
        return jsonify({"ticket_id": ticket_id, "priority": priority}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── GET /api/complaints/<customer_id> ────────────────────────────────────────
@complaint_bp.route("/<customer_id>", methods=["GET"])
def list_complaints(customer_id):
    try:
        complaints = get_complaints_by_customer(customer_id)
        return jsonify({"complaints": complaints}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500