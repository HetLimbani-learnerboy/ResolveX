import os
import json
import re
import joblib
from datetime import datetime
from flask import Blueprint, request, jsonify
from scipy.sparse import hstack
from groq import Groq
from dotenv import load_dotenv

# Internal Project Imports (Ensure these models/configs exist)
from config.db import get_connection
from models.complaint_model import insert_complaint
from ml.preprocessing import TextPreprocessor

load_dotenv()

customerse_api = Blueprint("customerse_api", __name__)

# ============================================================
# ML FALLBACK MODELS SETUP
# ============================================================
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_dir = os.path.join(base_dir, 'ml', 'trained_models')

try:
    tfidf      = joblib.load(os.path.join(model_dir, 'tfidf_vectorizer.pkl'))
    cat_model  = joblib.load(os.path.join(model_dir, 'category_classifier.pkl'))
    cat_enc    = joblib.load(os.path.join(model_dir, 'category_encoder.pkl'))
    prio_model = joblib.load(os.path.join(model_dir, 'priority_classifier.pkl'))
    prio_enc   = joblib.load(os.path.join(model_dir, 'priority_encoder.pkl'))
    ml_models_loaded = True
except Exception as e:
    print(f"⚠️ ML models not loaded: {e}")
    ml_models_loaded = False

preprocessor = TextPreprocessor()

# ============================================================
# GROQ AI ENGINE SETUP
# ============================================================
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

# Prompt 1: Fact Extraction
CLASSIFIER_PROMPT = """
Analyze the customer communication and extract:
1. Subject: Concise title (max 6 words).
2. Category: Exactly one of [Product, Packaging, Trade].
3. Priority: Exactly one of [Low, Medium, High].
4. Validity: Boolean true if this is a real support request, false if it is gibberish, spam, or nonsense.
Return JSON ONLY:
{ "subject": "", "category": "", "priority": "", "is_valid": true }
"""

# Prompt 2: Strategic Recommendations
ACTION_PROMPT = """
You are a Senior Support Strategist. Provide 1 to 3 bulleted strategic actions.
RULES:
1. Bullet points ONLY (use '-').
2. Be specific (e.g., 'Check app inventory status').
3. Max 3 bullets, each under 15 words.
Format:
- Action 1
- Action 2
"""

# ============================================================
# AI CORE FUNCTIONS (Must be defined before routes)
# ============================================================

def analyze_incoming_text(raw_text):
    """Two-step pipeline: Facts extraction then Action generation."""
    try:
        # Step 1: Detective Phase (Classification)
        resp1 = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": CLASSIFIER_PROMPT},
                      {"role": "user", "content": raw_text}],
            temperature=0,
            response_format={"type": "json_object"}
        )
        data = json.loads(resp1.choices[0].message.content)

        # Ensure is_valid exists
        if "is_valid" not in data:
            data["is_valid"] = True

        # If it's invalid, don't bother with recommendations
        if not data["is_valid"]:
            data["recommended_action"] = "No action: Invalid input."
            data["ai_confidence"] = 0.0
            return data

        # Step 2: Expert Phase (Recommendations)
        resp2 = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": ACTION_PROMPT},
                      {"role": "user", "content": f"Issue: {raw_text}\nCategory: {data['category']}"}],
            temperature=0.4
        )
        
        data['recommended_action'] = resp2.choices[0].message.content.strip()
        data['ai_confidence'] = 94.5
        return data

    except Exception as e:
        print(f"❌ AI Engine Error: {e}")
        return None

def ml_fallback(text):
    """Standard ML classification if AI fails."""
    if not ml_models_loaded:
        return None
    cleaned = preprocessor.clean_text(text)
    sentiment = preprocessor.get_sentiment(text)
    
    X_tfidf = tfidf.transform([cleaned])
    cat_idx = cat_model.predict(X_tfidf)[0]
    category = cat_enc.inverse_transform([cat_idx])[0]
    
    X_combined = hstack([X_tfidf, [[sentiment]]])
    prio_idx = prio_model.predict(X_combined)[0]
    priority = prio_enc.inverse_transform([prio_idx])[0]
    
    return {
        "subject": text[:40] + "...",
        "category": category,
        "priority": priority,
        "recommended_action": f"- Manual review required for {category} issue",
        "ai_confidence": 60.0
    }

# ============================================================
# FLASK ROUTES
# ============================================================

@customerse_api.route("/process_complaint", methods=["POST"])
def process_complaint():
    data = request.get_json(force=True)
    raw_text = (data.get("text") or "").strip()
    channel = data.get("channel", "Email")

    if not raw_text:
        return jsonify({"error": "No input provided"}), 400

    # 1. Run Intelligence Pipeline
    ai_result = analyze_incoming_text(raw_text)

    # 1b. Fallback to Local ML if LLM fails (e.g. Rate Limit or Network)
    if not ai_result:
        print("🔄 LLM Failed. Falling back to Local ML Models...")
        ai_result = ml_fallback(raw_text)
        if ai_result:
            ai_result["is_valid"] = True # Fallback assumes valid if it processed
            # Check if fallback actually found something (optional: could check sentiment)
            if len(raw_text) < 5 or ai_result["category"] == "Other":
                ai_result["is_valid"] = False

    if not ai_result:
        return jsonify({"error": "AI processing core failed completely."}), 500

    # 2. SPAM CHECK: Do not insert if invalid
    if not ai_result.get("is_valid", True):
        return jsonify({
            "success": False,
            "error": "Input rejected: Spam or Gibberish detected.",
            "ai_reason": "The AI engine flagged this as non-compliant or junk text."
        }), 422  # Unprocessable Entity

    # 3. DATABASE INSERTION (Only for valid messages)
    try:
        ticket_id = insert_complaint(
            subject=ai_result['subject'],
            category=ai_result['category'],
            complaint_text=raw_text,
            priority=ai_result['priority'],
            recommended_action=ai_result['recommended_action'],
            ai_confidence=ai_result['ai_confidence'],
            complaint_source=channel
        )
        
        return jsonify({
            "success": True, 
            "ticket_id": str(ticket_id), 
            "data": ai_result
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@customerse_api.route("/escalate/<complaint_id>", methods=["PUT"])
def escalate_complaint(complaint_id):
    conn = get_connection()
    if not conn: return jsonify({"error": "DB unreachable"}), 500
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE complaints
            SET priority = 'Critical', status = 'Escalated', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s RETURNING id, priority, status
        """, (complaint_id,))
        row = cur.fetchone()
        conn.commit()
        if not row: return jsonify({"error": "Ticket not found"}), 404
        return jsonify({"id": str(row[0]), "priority": row[1], "status": row[2]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()