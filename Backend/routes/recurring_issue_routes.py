# ==========================================================
# routes/recurring_issue_routes.py
# LLM Based Complaint Grouping Route
# ==========================================================

from flask import Blueprint, jsonify
from services.recurring_issue_service import (
    track_recurring_issue,
    get_recurring_dashboard
)
from config.db import get_connection

recurring_bp = Blueprint(
    "recurring_bp",
    __name__,
    url_prefix="/api/recurring"
)


# ==========================================================
# AUTO TRACK SINGLE COMPLAINT
# ==========================================================
@recurring_bp.route("/analyze", methods=["POST"])
def analyze_recurring():

    from flask import request

    try:
        data = request.get_json(force=True)

        category = data.get("category", "Other")
        subject = data.get("subject", "")
        complaint_text = data.get("complaint_text", "")

        result = track_recurring_issue(
            category,
            subject,
            complaint_text
        )

        return jsonify({
            "success": True,
            "analysis": result
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================================================
# MANAGER DASHBOARD
# READ COMPLAINTS -> SEND TO LLM -> GROUP WISE OUTPUT
# ==========================================================
@recurring_bp.route("/dashboard", methods=["GET"])
def dashboard():

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, subject, category, complaint_text,
                   priority, status, created_at
            FROM complaints
            ORDER BY created_at DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        # ---------------------------------------
        # Feed every complaint to LLM tracker
        # ---------------------------------------
        for row in rows:

            complaint_id = row[0]
            subject = row[1]
            category = row[2]
            complaint_text = row[3]

            track_recurring_issue(
                category,
                subject,
                complaint_text
            )

        # ---------------------------------------
        # Get Final Grouped Data
        # ---------------------------------------
        grouped_data = get_recurring_dashboard()

        return jsonify({
            "success": True,
            "total_groups": len(grouped_data),
            "data": grouped_data
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500