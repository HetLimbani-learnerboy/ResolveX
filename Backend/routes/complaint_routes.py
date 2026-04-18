from flask import Blueprint, request, jsonify
from config.db import get_connection
from models.complaint_model import insert_complaint, get_complaints_by_customer
from services.gemini_service import get_ai_suggestion
import datetime

complaint_bp = Blueprint("complaint_bp", __name__)

# ==========================================
# CREATE / SUBMIT COMPLAINT
# ==========================================
@complaint_bp.route("/submit", methods=["POST"])
def submit_complaint():
    """
    Unified route for creating a ticket. 
    Matches the CustomerDashboard's fetch call.
    """
    data = request.get_json(force=True)

    customer_id = data.get("customer_id")
    subject = (data.get("subject") or "").strip()
    category = (data.get("category") or "Product").strip()
    complaint_text = (data.get("complaint_text") or "").strip()

    if not subject or not complaint_text:
        return jsonify({"error": "Subject and complaint text are required."}), 400

    # Default AI analysis values
    priority = "Medium"
    recommended_action = "Awaiting AI review"
    ai_confidence = 0.0

    # Attempt AI Analysis (Gemini)
    try:
        suggestion = get_ai_suggestion(subject, category, complaint_text)
        recommended_action = suggestion
        
        # Simple AI Confidence simulation for the audit dashboard
        ai_confidence = 85.0 if len(complaint_text) > 20 else 45.0
        
        # Naive priority extraction
        text_lower = suggestion.lower()
        if "critical" in text_lower: priority = "Critical"
        elif "high" in text_lower: priority = "High"
        elif "low" in text_lower: priority = "Low"
    except Exception as e:
        print(f"AI Service Error: {e}")
        pass # Non-fatal

    try:
        # Use your model's insert function
        ticket_id = insert_complaint(
            customer_id=customer_id,
            subject=subject,
            category=category,
            complaint_text=complaint_text,
            priority=priority,
            recommended_action=recommended_action,
            ai_confidence=ai_confidence,
        )
        return jsonify({
            "message": "Complaint Created Successfully",
            "ticket_id": str(ticket_id),
            "priority": priority
        }), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

# ==========================================
# GET ALL COMPLAINTS (For Audit Dashboard)
# ==========================================
@complaint_bp.route("/all", methods=["GET"])
def get_all_complaints():
    """
    Returns all complaints for the Audit/Manager dashboard.
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, customer_id, executive_id, complaint_source, subject, 
                   complaint_text, category, priority, ai_confidence, 
                   recommended_action, status, sla_deadline, created_at
            FROM complaints
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        
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
                "ai_confidence": float(row[8]) if row[8] is not None else 0.0,
                "recommended_action": row[9],
                "status": row[10],
                "sla_deadline": str(row[11]) if row[11] else None,
                "created_at": row[12].isoformat() if row[12] else None
            })
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ==========================================
# GET CUSTOMER SPECIFIC COMPLAINTS
# ==========================================
@complaint_bp.route("/customer/<customer_id>", methods=["GET"])
def list_customer_complaints(customer_id):
    try:
        # Assuming get_complaints_by_customer is implemented in models
        complaints = get_complaints_by_customer(customer_id)
        return jsonify(complaints), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

# ==========================================
# UPDATE STATUS
# ==========================================
@complaint_bp.route("/update-status/<complaint_id>", methods=["PUT"])
def update_status(complaint_id):
    data = request.get_json()
    new_status = data.get("status")
    
    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE complaints
            SET status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, complaint_id))
        conn.commit()
        return jsonify({"message": "Status Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ==========================================
# DELETE COMPLAINT
# ==========================================
@complaint_bp.route("/delete/<complaint_id>", methods=["DELETE"])
def delete_complaint(complaint_id):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM complaints WHERE id = %s", (complaint_id,))
        conn.commit()
        return jsonify({"message": "Deleted Successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()