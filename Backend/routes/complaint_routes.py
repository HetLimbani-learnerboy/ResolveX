# ==========================================
# routes/complaint_routes.py
# ==========================================

from flask import Blueprint, request, jsonify
from config.db import get_connection

complaint_bp = Blueprint("complaint_bp", __name__)


# ==========================================
# CREATE COMPLAINT
# ==========================================
@complaint_bp.route("/create", methods=["POST"])
def create_complaint():
    data = request.json

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO complaints (
            customer_id,
            executive_id,
            complaint_source,
            subject,
            complaint_text,
            category,
            priority,
            ai_confidence,
            recommended_action,
            status,
            sla_deadline
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, (
        data.get("customer_id"),
        data.get("executive_id"),
        data["complaint_source"],
        data.get("subject"),
        data["complaint_text"],
        data.get("category"),
        data.get("priority", "Low"),
        data.get("ai_confidence"),
        data.get("recommended_action"),
        data.get("status", "Open"),
        data.get("sla_deadline")
    ))

    complaint_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "message": "Complaint Created Successfully",
        "complaint_id": str(complaint_id)
    })


# ==========================================
# GET ALL COMPLAINTS
# ==========================================
@complaint_bp.route("/all", methods=["GET"])
def get_all_complaints():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM complaints
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "id": str(row[0]),
            "customer_id": str(row[1]) if row[1] else None,
            "executive_id": str(row[2]) if row[2] else None,
            "complaint_source": row[3],
            "subject": row[4],
            "complaint_text": row[5],
            "category": row[6],
            "priority": row[7],
            "ai_confidence": row[8],
            "recommended_action": row[9],
            "status": row[10],
            "sla_deadline": row[11],
            "created_at": row[12],
            "updated_at": row[13]
        })

    return jsonify(data)


# ==========================================
# GET SINGLE COMPLAINT
# ==========================================
@complaint_bp.route("/<complaint_id>", methods=["GET"])
def get_single_complaint(complaint_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM complaints
        WHERE id = %s
    """, (complaint_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return jsonify({
            "message": "Complaint Not Found"
        }), 404

    return jsonify({
        "id": str(row[0]),
        "customer_id": str(row[1]) if row[1] else None,
        "executive_id": str(row[2]) if row[2] else None,
        "complaint_source": row[3],
        "subject": row[4],
        "complaint_text": row[5],
        "category": row[6],
        "priority": row[7],
        "ai_confidence": row[8],
        "recommended_action": row[9],
        "status": row[10],
        "sla_deadline": row[11],
        "created_at": row[12],
        "updated_at": row[13]
    })


# ==========================================
# UPDATE STATUS
# ==========================================
@complaint_bp.route("/update-status/<complaint_id>", methods=["PUT"])
def update_status(complaint_id):
    data = request.json

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE complaints
        SET status = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (
        data["status"],
        complaint_id
    ))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "message": "Complaint Status Updated"
    })


# ==========================================
# DELETE COMPLAINT
# ==========================================
@complaint_bp.route("/delete/<complaint_id>", methods=["DELETE"])
def delete_complaint(complaint_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM complaints
        WHERE id = %s
    """, (complaint_id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "message": "Complaint Deleted Successfully"
    })
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
