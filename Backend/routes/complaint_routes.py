from flask import Blueprint, request, jsonify
from config.db import get_connection
from services.gemini_service import get_ai_suggestion
import datetime
import uuid

complaint_bp = Blueprint("complaint_bp", __name__)


def _ensure_customer_exists(conn, user_id, fallback_name="Customer", fallback_email="customer@resolvex.com"):
    """
    Ensures a row exists in the 'customers' table for the given user_id.
    If it doesn't, insert one so that the FK constraint on complaints is satisfied.
    """
    if not user_id:
        return None
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM customers WHERE id = %s", (user_id,))
        if cur.fetchone():
            return user_id  # Already exists

        # Try to pull name/email from the users table
        cur.execute("SELECT full_name, email FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        name = user_row[0] if user_row else fallback_name
        email = user_row[1] if user_row else fallback_email

        cur.execute("""
            INSERT INTO customers (id, full_name, email)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (user_id, name, email))
        conn.commit()
        return user_id
    except Exception as e:
        print(f"⚠️ _ensure_customer_exists error: {e}")
        conn.rollback()
        return None
    finally:
        cur.close()


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

        # AI Confidence based on complaint quality
        ai_confidence = 85.0 if len(complaint_text) > 20 else 45.0

        # Naive priority extraction from AI response
        text_lower = suggestion.lower()
        if "critical" in text_lower:
            priority = "Critical"
        elif "high" in text_lower:
            priority = "High"
        elif "low" in text_lower:
            priority = "Low"
    except Exception as e:
        print(f"AI Service Error (non-fatal): {e}")

    # Database insertion
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed. Please try again."}), 503

    try:
        # Ensure the customer_id exists in customers table (fixes FK constraint)
        safe_customer_id = _ensure_customer_exists(conn, customer_id)

        cur = conn.cursor()
        cur.execute("""
            INSERT INTO complaints (
                customer_id, subject, category, complaint_text,
                priority, recommended_action, ai_confidence, complaint_source
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (safe_customer_id, subject, category, complaint_text,
              priority, recommended_action, ai_confidence, "Web"))

        ticket_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Complaint Created Successfully",
            "ticket_id": str(ticket_id),
            "priority": priority
        }), 201
    except Exception as exc:
        conn.close()
        return jsonify({"error": str(exc)}), 500


# ==========================================
# GET ALL COMPLAINTS (For Audit Dashboard)
# ==========================================
@complaint_bp.route("/all", methods=["GET"])
def get_all_complaints():
    """
    Returns all complaints for the Audit/Manager dashboard,
    now including real-time SLA metrics calculation.
    """
    from services.sla_calculator import calculate_sla_score
    import datetime

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 503

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
            created_at = row[12]
            sla_deadline = row[11]
            priority = row[7] or "Medium"

            # Auto-synthesize deadline if null purely for reporting consistency
            if not sla_deadline and created_at:
                if priority.lower() in ['critical', 'high']:
                    sla_deadline = created_at + datetime.timedelta(hours=24)
                elif priority.lower() == 'medium':
                    sla_deadline = created_at + datetime.timedelta(hours=48)
                else:
                    sla_deadline = created_at + datetime.timedelta(hours=72)
            
            # Run SLA Algorithm
            sla_result = {"final_score": 0.0, "status": "No SLA"}
            current_status = row[10]
            if created_at and sla_deadline:
                sla_result = calculate_sla_score(created_at, sla_deadline, priority)
            
            # --- AUTO-ESCALATION LOGIC ---
            # If SLA has breached (score 0) and it's not already resolved/closed/escalated:
            if sla_result["final_score"] <= 0 and current_status not in ['Resolved', 'Closed', 'Escalated']:
                try:
                    # Update DB immediately
                    cur.execute("""
                        UPDATE complaints 
                        SET status = 'Escalated', priority = 'Critical', updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (row[0],))
                    conn.commit()
                    # Reflect in current response object
                    current_status = 'Escalated'
                    priority = 'Critical'
                except Exception as db_err:
                    print(f"⚠️ Auto-escalation DB error: {db_err}")

            data.append({
                "id": str(row[0]),
                "customer_id": str(row[1]) if row[1] else None,
                "executive_id": str(row[2]) if row[2] else None,
                "complaint_source": row[3],
                "subject": row[4],
                "complaint_text": row[5],
                "category": row[6],
                "priority": priority,
                "ai_confidence": float(row[8]) if row[8] is not None else 0.0,
                "recommended_action": row[9],
                "status": current_status,
                "sla_deadline": sla_deadline.isoformat() if sla_deadline else None,
                "created_at": created_at.isoformat() if created_at else None,
                "sla_score": sla_result["final_score"],
                "sla_status": sla_result["status"]
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
    conn = get_connection()
    if not conn:
        return jsonify([]), 200

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, subject, category, priority, status, created_at
            FROM complaints
            WHERE customer_id = %s
            ORDER BY created_at DESC
        """, (customer_id,))
        rows = cur.fetchall()
        complaints = []
        for row in rows:
            complaints.append({
                "id": str(row[0]),
                "subject": row[1],
                "category": row[2],
                "priority": row[3],
                "status": row[4],
                "created_at": row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else None
            })
        return jsonify(complaints), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        cur.close()
        conn.close()


# ==========================================
# UPDATE STATUS
# ==========================================
STATUS_PROGRESS = {
    'Open': 10, 'Under Review': 30, 'In Progress': 50,
    'Escalated': 60, 'Resolved': 100, 'Closed': 100
}

@complaint_bp.route("/update-status/<complaint_id>", methods=["PUT"])
def update_status(complaint_id):
    data = request.get_json()
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 503

    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE complaints
            SET status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, complaint_id))
        conn.commit()
        return jsonify({
            "message": "Status Updated",
            "status": new_status,
            "progress": STATUS_PROGRESS.get(new_status, 50)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ==========================================
# ESCALATE COMPLAINT TO CRITICAL
# ==========================================
@complaint_bp.route("/escalate/<complaint_id>", methods=["PUT"])
def escalate_complaint(complaint_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 503

    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE complaints
            SET priority = 'Critical', status = 'Escalated', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (complaint_id,))
        conn.commit()
        return jsonify({
            "message": "Complaint escalated to Critical",
            "priority": "Critical",
            "status": "Escalated",
            "progress": 60
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ==========================================
# UPDATE CATEGORY / PRIORITY (for Misclassifications edit)
# ==========================================
@complaint_bp.route("/update/<complaint_id>", methods=["PUT"])
def update_complaint(complaint_id):
    data = request.get_json()
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 503

    cur = conn.cursor()
    try:
        updates = []
        params = []
        if "category" in data:
            updates.append("category = %s")
            params.append(data["category"])
        if "priority" in data:
            updates.append("priority = %s")
            params.append(data["priority"])
        if "status" in data:
            updates.append("status = %s")
            params.append(data["status"])

        if not updates:
            return jsonify({"error": "No fields to update"}), 400

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(complaint_id)

        cur.execute(f"UPDATE complaints SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return jsonify({"message": "Complaint updated successfully"}), 200
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
    if not conn:
        return jsonify({"error": "Database connection failed"}), 503

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