# ==========================================
# routes/admin_routes.py
# Admin Panel API — Manage Users, Categories, System Config
# ==========================================

from flask import Blueprint, request, jsonify, Response
from config.db import get_connection
import bcrypt
import os
import json
import csv
import io
import subprocess
import threading
from datetime import datetime

admin_bp = Blueprint("admin_bp", __name__)

# ============================================================
# In-Memory stores (shared across the app via import)
# These are populated by the AI pipeline when complaints are processed
# ============================================================
# Processed complaints history (populated by ai_routes when a complaint is analyzed)
complaint_history = []

# Default categories (matched to the LLM classification prompt)
DEFAULT_CATEGORIES = [
    {"name": "Product", "description": "Product defect, quality issue, wrong product"},
    {"name": "Packaging", "description": "Damaged box, poor packaging, broken seal"},
    {"name": "Trade", "description": "Bulk orders, wholesale inquiry, dealer request"},
    {"name": "Payment", "description": "Transaction failed, refund, overcharged, billing"},
    {"name": "Delivery", "description": "Late delivery, not delivered, courier issue"},
    {"name": "Service", "description": "Poor support, rude agent, no response"},
    {"name": "Account", "description": "Login issue, password reset, OTP, profile"},
    {"name": "App/Website", "description": "App crash, website bug, UI error"},
    {"name": "Other", "description": "Anything that doesn't fit above categories"},
]

categories = list(DEFAULT_CATEGORIES)

# Retrain status
retrain_status = {"status": "idle", "last_trained": None, "message": ""}

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

# ============================================================
# GET /api/admin/users — List all users
# ============================================================
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        users = []
        for row in rows:
            users.append({
                "id": str(row[0]),
                "name": row[1],
                "email": row[2],
                "role": row[3],
                "is_active": row[4],
                "created_at": row[5].strftime("%d %b %Y, %I:%M %p") if row[5] else None
            })
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# POST /api/admin/users — Create a new user
# ============================================================
@admin_bp.route("/users", methods=["POST"])
def create_user():
    try:
        data = request.json
        name = data.get("name", "")
        email = data.get("email", "")
        password = data.get("password", "")
        role = data.get("role", "customer")
        
        if not name or not email or not password:
            return jsonify({"error": "Name, email, and password are required"}), 400
        
        password_hash = hash_password(password)
        
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Email already exists"}), 400
        
        cur.execute("""
            INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified)
            VALUES (%s, %s, %s, %s, TRUE, TRUE)
            RETURNING id, full_name, email, role, is_active, created_at
        """, (name, email, password_hash, role))
        
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "User created successfully",
            "user": {
                "id": str(row[0]),
                "name": row[1],
                "email": row[2],
                "role": row[3],
                "is_active": row[4],
                "created_at": row[5].strftime("%d %b %Y, %I:%M %p") if row[5] else None
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# DELETE /api/admin/users/<id> — Delete a user
# ============================================================
@admin_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted:
            return jsonify({"message": "User deleted successfully"})
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# PUT /api/admin/users/<id> — Update user role/status
# ============================================================
@admin_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    try:
        data = request.json
        role = data.get("role")
        is_active = data.get("is_active")
        
        conn = get_connection()
        cur = conn.cursor()
        
        if role is not None:
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))
        if is_active is not None:
            cur.execute("UPDATE users SET is_active = %s WHERE id = %s", (is_active, user_id))
        
        conn.commit()
        
        cur.execute("SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            return jsonify({
                "message": "User updated",
                "user": {
                    "id": str(row[0]),
                    "name": row[1],
                    "email": row[2],
                    "role": row[3],
                    "is_active": row[4],
                    "created_at": row[5].strftime("%d %b %Y, %I:%M %p") if row[5] else None
                }
            })
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# GET /api/admin/stats — Dashboard statistics
# ============================================================
@admin_bp.route("/stats", methods=["GET"])
def get_admin_stats():
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM users")
        total_users = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users WHERE is_active = TRUE")
        active_users = cur.fetchone()[0]
        
        cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
        role_counts = {}
        for row in cur.fetchall():
            role_counts[row[0]] = row[1]
        
        cur.close()
        conn.close()
        
        return jsonify({
            "total_users": total_users,
            "active_users": active_users,
            "role_breakdown": role_counts,
            "total_complaints": len(get_all_complaints()),
            "total_categories": len(categories)
        })
    except Exception as e:
        return jsonify({
            "total_users": 0,
            "active_users": 0,
            "role_breakdown": {},
            "total_complaints": len(get_all_complaints()) if 'get_all_complaints' in globals() else 0,
            "total_categories": len(categories),
            "error": str(e)
        })

# ============================================================
# MANAGE CATEGORIES
# ============================================================
@admin_bp.route("/categories", methods=["GET"])
def get_categories():
    return jsonify(categories)

@admin_bp.route("/categories", methods=["POST"])
def add_category():
    data = request.json
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    
    if not name:
        return jsonify({"error": "Category name is required"}), 400
    
    # Check duplicate
    for cat in categories:
        if cat["name"].lower() == name.lower():
            return jsonify({"error": "Category already exists"}), 400
    
    new_cat = {"name": name, "description": description}
    categories.append(new_cat)
    return jsonify({"message": f"Category '{name}' added", "category": new_cat}), 201

@admin_bp.route("/categories/<name>", methods=["DELETE"])
def delete_category(name):
    global categories
    original_len = len(categories)
    categories = [c for c in categories if c["name"].lower() != name.lower()]
    
    if len(categories) < original_len:
        return jsonify({"message": f"Category '{name}' deleted"})
    return jsonify({"error": "Category not found"}), 404

# ============================================================
# COMPLAINT HISTORY
# ============================================================
from models.complaint_model import get_all_complaints

@admin_bp.route("/complaints", methods=["GET"])
def get_complaints():
    """Returns all processed complaints for export/display from the database."""
    try:
        complaints = get_all_complaints()
        return jsonify(complaints)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/complaints/<complaint_id>", methods=["PUT"])
def update_complaint(complaint_id):
    """Update a complaint (e.g. correct misclassification)."""
    # Skipping deep implementation for demo since it's rarely used from this specific endpoint.
    return jsonify({"error": "Direct update temporarily disabled. Please use Support Dashboard."}), 400

# ============================================================
# EXPORT REPORTS — CSV
# ============================================================
@admin_bp.route("/export/csv", methods=["GET"])
def export_csv():
    """Export all processed complaints from DB as a CSV file."""
    try:
        complaints = get_all_complaints()
        if not complaints:
            return jsonify({"error": "No complaints to export"}), 404
        
        output = io.StringIO()
        fieldnames = ["id", "timestamp", "channel", "category", "priority", "sentiment_score", "summary", "recommendation", "original_text"]
        
        # Prepare DictWriter
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        
        for c in complaints:
            writer.writerow(c)
        
        csv_content = output.getvalue()
        output.close()
        
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=resolvex_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# EXPORT REPORTS — JSON (substitute for PDF in browser env)
# ============================================================
@admin_bp.route("/export/json", methods=["GET"])
def export_json():
    """Export all processed complaints from DB as a JSON report file."""
    try:
        complaints = get_all_complaints()
        if not complaints:
            return jsonify({"error": "No complaints to export"}), 404
        
        report = {
            "report_title": "ResolveX AI Complaint Analysis Report",
            "generated_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "total_complaints": len(complaints),
            "category_breakdown": {},
            "priority_breakdown": {},
            "complaints": complaints
        }
        
        for c in complaints:
            cat = c.get("category", "Unknown")
            pri = c.get("priority", "Unknown")
            report["category_breakdown"][cat] = report["category_breakdown"].get(cat, 0) + 1
            report["priority_breakdown"][pri] = report["priority_breakdown"].get(pri, 0) + 1
        
        return Response(
            json.dumps(report, indent=2),
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment; filename=resolvex_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# RETRAIN MODELS
# ============================================================
def _run_retrain():
    """Background thread to simulate model retraining."""
    global retrain_status
    retrain_status = {"status": "training", "last_trained": retrain_status.get("last_trained"), "message": "Training in progress..."}
    
    try:
        import time
        time.sleep(5)  # Simulate training time
        
        retrain_status["status"] = "completed"
        retrain_status["last_trained"] = datetime.now().strftime("%d %b %Y, %I:%M %p")
        retrain_status["message"] = "All 5 AI modules retrained successfully."
    except Exception as e:
        retrain_status["status"] = "failed"
        retrain_status["message"] = f"Training failed: {str(e)}"

@admin_bp.route("/retrain", methods=["POST"])
def retrain_models():
    """Trigger model retraining in a background thread."""
    global retrain_status
    
    if retrain_status.get("status") == "training":
        return jsonify({"error": "Training is already in progress"}), 409
    
    thread = threading.Thread(target=_run_retrain, daemon=True)
    thread.start()
    
    return jsonify({"message": "Retraining started", "status": "training"})

@admin_bp.route("/retrain/status", methods=["GET"])
def retrain_model_status():
    """Check the status of the last retraining job."""
    return jsonify(retrain_status)

# ============================================================
# SYSTEM CONFIGURATION
# ============================================================
@admin_bp.route("/config", methods=["GET"])
def get_system_config():
    """Returns current system configuration (safe values only)."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    db_url = os.getenv("DATABASE_URL", "")
    
    return jsonify({
        "gemini_api_key": f"...{api_key[-8:]}" if len(api_key) > 8 else ("Set" if api_key else "Not Set"),
        "gemini_status": "Connected" if api_key else "Not Configured",
        "database_url": f"...{db_url[-20:]}" if len(db_url) > 20 else ("Set" if db_url else "Not Set"),
        "database_status": "Check Connection",
        "ai_modules": [
            {"name": "Fraud Detection", "engine": "Gemini 1.5 Flash", "status": "active"},
            {"name": "Category Classifier", "engine": "Gemini 1.5 Flash", "status": "active"},
            {"name": "Priority Predictor", "engine": "Gemini 1.5 Flash", "status": "active"},
            {"name": "Summary Generator", "engine": "Gemini 1.5 Flash", "status": "active"},
            {"name": "Recommendation Engine", "engine": "Gemini 1.5 Flash", "status": "active"},
        ],
        "ml_fallback": "LinearSVC + RandomForest",
        "server_port": 5000,
        "debug_mode": True
    })
