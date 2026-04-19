# ==========================================
# routes/feedback_routes.py
# ==========================================

from flask import Blueprint, request, jsonify
from config.db import get_connection

feedback_bp = Blueprint("feedback_bp", __name__)


def _ensure_customer_exists(conn, user_id):
    """Ensures a row exists in 'customers' table for the given user_id (from users table)."""
    if not user_id:
        return None
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM customers WHERE id = %s", (user_id,))
        if cur.fetchone():
            return user_id
        # Pull from users table
        cur.execute("SELECT full_name, email FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        name = user_row[0] if user_row else "Customer"
        email = user_row[1] if user_row else "customer@resolvex.com"
        cur.execute("""
            INSERT INTO customers (id, full_name, email)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (user_id, name, email))
        conn.commit()
        return user_id
    except Exception as e:
        print(f"⚠️ _ensure_customer_exists (feedback): {e}")
        conn.rollback()
        return None
    finally:
        cur.close()


# ==========================================
# SUBMIT FEEDBACK
# ==========================================
@feedback_bp.route("/submit", methods=["POST"])
def submit_feedback():
    """
    Submit feedback for a complaint.
    Body: { complaint_id, customer_id, rating (1-5), feedback_text }
    """
    data = request.get_json(force=True)

    complaint_id = data.get("complaint_id")
    customer_id = data.get("customer_id")
    rating = data.get("rating")
    feedback_text = (data.get("feedback_text") or "").strip()

    if not complaint_id or not rating:
        return jsonify({"error": "complaint_id and rating are required."}), 400

    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be an integer between 1 and 5."}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed."}), 503

    try:
        # Ensure customer exists in customers table (fixes FK constraint)
        safe_customer_id = _ensure_customer_exists(conn, customer_id)

        cur = conn.cursor()
        # Check if feedback already exists for this complaint from this customer
        if safe_customer_id:
            cur.execute("""
                SELECT id FROM feedback
                WHERE complaint_id = %s AND customer_id = %s
            """, (complaint_id, safe_customer_id))
        else:
            cur.execute("""
                SELECT id FROM feedback
                WHERE complaint_id = %s AND customer_id IS NULL
            """, (complaint_id,))

        existing = cur.fetchone()
        if existing:
            # Update existing feedback
            cur.execute("""
                UPDATE feedback
                SET rating = %s, feedback_text = %s, created_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (rating, feedback_text, existing[0]))
        else:
            # Insert new feedback
            cur.execute("""
                INSERT INTO feedback (complaint_id, customer_id, rating, feedback_text)
                VALUES (%s, %s, %s, %s)
            """, (complaint_id, safe_customer_id, rating, feedback_text))

        conn.commit()
        cur.close()
        return jsonify({"message": "Feedback submitted successfully!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ==========================================
# GET FEEDBACK FOR A COMPLAINT
# ==========================================
@feedback_bp.route("/complaint/<complaint_id>", methods=["GET"])
def get_feedback_for_complaint(complaint_id):
    conn = get_connection()
    if not conn:
        return jsonify([]), 200

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT f.id, f.complaint_id, f.customer_id, f.rating, f.feedback_text, f.created_at
            FROM feedback f
            WHERE f.complaint_id = %s
            ORDER BY f.created_at DESC
        """, (complaint_id,))
        rows = cur.fetchall()
        data = []
        for row in rows:
            data.append({
                "id": str(row[0]),
                "complaint_id": str(row[1]),
                "customer_id": str(row[2]) if row[2] else None,
                "rating": row[3],
                "feedback_text": row[4],
                "created_at": row[5].isoformat() if row[5] else None
            })
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ==========================================
# GET ALL FEEDBACK (for Manager / Admin dashboard)
# ==========================================
@feedback_bp.route("/all", methods=["GET"])
def get_all_feedback():
    conn = get_connection()
    if not conn:
        return jsonify([]), 200

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT f.id, f.complaint_id, f.customer_id, f.rating, f.feedback_text, f.created_at,
                   c.subject, c.category, cus.full_name, cus.email
            FROM feedback f
            LEFT JOIN complaints c ON f.complaint_id = c.id
            LEFT JOIN customers cus ON f.customer_id = cus.id
            ORDER BY f.created_at DESC
        """)
        rows = cur.fetchall()
        data = []
        for row in rows:
            data.append({
                "id": str(row[0]),
                "complaint_id": str(row[1]),
                "customer_id": str(row[2]) if row[2] else None,
                "rating": row[3],
                "feedback_text": row[4],
                "created_at": row[5].isoformat() if row[5] else None,
                "complaint_subject": row[6],
                "complaint_category": row[7],
                "customer_name": row[8] or "Unknown",
                "customer_email": row[9] or "N/A"
            })
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ==========================================
# CHECK IF CUSTOMER ALREADY GAVE FEEDBACK
# ==========================================
@feedback_bp.route("/check/<complaint_id>/<customer_id>", methods=["GET"])
def check_feedback_exists(complaint_id, customer_id):
    conn = get_connection()
    if not conn:
        return jsonify({"has_feedback": False}), 200

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT rating, feedback_text FROM feedback
            WHERE complaint_id = %s AND customer_id = %s
        """, (complaint_id, customer_id))
        row = cur.fetchone()
        if row:
            return jsonify({"has_feedback": True, "rating": row[0], "feedback_text": row[1]}), 200
        return jsonify({"has_feedback": False}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
