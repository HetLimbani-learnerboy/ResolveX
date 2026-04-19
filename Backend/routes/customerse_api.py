# ============================================================
# routes/ai_routes.py
# ============================================================

from flask import Blueprint, request, jsonify
import os
import json
from datetime import datetime
import joblib
from scipy.sparse import hstack
from ml.preprocessing import TextPreprocessor
import google.generativeai as genai
from dotenv import load_dotenv
from models.complaint_model import insert_complaint
from config.db import get_connection

load_dotenv()

customerse_api = Blueprint("customerse_api", __name__)

# ============================================================
# ML Models (Fast Fallback when LLM API is unavailable)
# ============================================================
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_dir = os.path.join(base_dir, 'ml', 'trained_models')

try:
    tfidf     = joblib.load(os.path.join(model_dir, 'tfidf_vectorizer.pkl'))
    cat_model = joblib.load(os.path.join(model_dir, 'category_classifier.pkl'))
    cat_enc   = joblib.load(os.path.join(model_dir, 'category_encoder.pkl'))
    prio_model= joblib.load(os.path.join(model_dir, 'priority_classifier.pkl'))
    prio_enc  = joblib.load(os.path.join(model_dir, 'priority_encoder.pkl'))
    ml_models_loaded = True
except Exception as e:
    print(f"Warning: ML fallback models not loaded. {e}")
    ml_models_loaded = False

preprocessor = TextPreprocessor()


# ============================================================
# LLM Engine Setup
# ============================================================
def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_ai_key")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')


def parse_llm_json(raw_text):
    raw = raw_text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return json.loads(raw.strip())


# ============================================================
# MODULE 1 – Fraud / Spam Detection
# ============================================================
def llm_fraud_detection(text, model):
    try:
        prompt = f"""You are a Fraud Detection AI for a customer support system.

Analyze the following text and determine if it is a VALID customer complaint or spam/gibberish.

Text: "{text}"

Rules:
- Any recognizable complaint, question, or feedback in any language → VALID.
- Random characters, keyboard mashing, test input, or completely meaningless → SPAM.

Respond ONLY with valid JSON, no extra text:
{{"is_valid": true}} or {{"is_valid": false}}"""
        response = model.generate_content(prompt)
        return parse_llm_json(response.text).get("is_valid", True)
    except Exception as e:
        print(f"LLM Fraud Detection Error: {e}")
        return True


# ============================================================
# MODULE 2 – Category Classification
# ============================================================
def llm_classify_category(text, sentiment, model):
    try:
        prompt = f"""You are an expert Complaint Classification AI for a wellness company.

Read the following customer complaint carefully:
---
{text}
---

Sentiment Score: {sentiment} (scale: -1.0 = very angry, 1.0 = happy)

Assign the single most appropriate CATEGORY:
- Product   (defect, quality issue, product not working, wrong product)
- Packaging (damaged box, poor packaging, crushed package, broken seal)
- Trade     (bulk orders, wholesale, dealer request, business partnership)
- Payment   (transaction failed, refund, overcharged, billing error)
- Delivery  (late delivery, not delivered, wrong address, courier issue)
- Service   (poor support, rude agent, no response, helpline issue)
- Account   (login issue, password reset, OTP, profile problem)
- App/Website (app crash, website bug, UI error, page not loading)
- Other     (anything else)

Respond ONLY with valid JSON, no extra text:
{{"category": "..."}}"""
        response = model.generate_content(prompt)
        return parse_llm_json(response.text).get("category", "Other")
    except Exception as e:
        print(f"LLM Classification Error: {e}")
        return None


# ============================================================
# MODULE 3 – Priority Prediction
# ============================================================
def llm_predict_priority(text, category, sentiment, model):
    try:
        prompt = f"""You are a Priority Assessment AI for customer support.

Complaint (Category: {category}):
---
{text}
---
Sentiment: {sentiment} (-1 angry, 1 happy)

Assign PRIORITY:
- Critical: Financial fraud, safety risk, legal threat, data breach.
- High:     Financial loss, extremely angry, words like "urgent"/"unacceptable".
- Medium:   Moderate frustration, standard complaints.
- Low:      Simple inquiry, feedback, mild tone, positive sentiment.

Respond ONLY with valid JSON:
{{"priority": "Critical"|"High"|"Medium"|"Low"}}"""
        response = model.generate_content(prompt)
        return parse_llm_json(response.text).get("priority", "Medium")
    except Exception as e:
        print(f"LLM Priority Error: {e}")
        return None


# ============================================================
# MODULE 4 – Recommendation Engine
# ============================================================
def get_llm_recommendation(text, category, priority, sentiment, model):
    if not model:
        return f"Escalate to {category} operations team."
    try:
        prompt = f"""You are an expert Customer Support AI.

Complaint: "{text}"
Category: {category} | Priority: {priority} | Sentiment: {sentiment}

Give 1 short, highly actionable next step (max 12 words) for the support agent.
No fluff — just the action."""
        response = model.generate_content(prompt)
        return response.text.replace('"', '').strip()
    except Exception as e:
        print(f"LLM Recommendation Error: {e}")
        return f"Review and assign to {category} team."


# ============================================================
# MODULE 5 – Summary Generator
# ============================================================
def llm_generate_summary(text, model):
    try:
        prompt = f"""Summarize the following customer complaint in exactly 1 short sentence (max 12 words).
Capture the core issue only. No greetings, no fluff.

Complaint:
---
{text}
---

Respond with ONLY the summary sentence, nothing else."""
        response = model.generate_content(prompt)
        return response.text.strip().strip('"')
    except Exception as e:
        print(f"LLM Summary Error: {e}")
        return text[:60] + "..."


# ============================================================
# ML Fallback
# ============================================================
def ml_fallback_classify(cleaned_text, sentiment):
    X_tfidf = tfidf.transform([cleaned_text])
    if X_tfidf.nnz == 0:
        return "Wrong Complain", "None"
    cat_pred_idx  = cat_model.predict(X_tfidf)[0]
    category      = cat_enc.inverse_transform([cat_pred_idx])[0]
    X_combined    = hstack([X_tfidf, [[sentiment]]])
    prio_pred_idx = prio_model.predict(X_combined)[0]
    priority      = prio_enc.inverse_transform([prio_pred_idx])[0]
    return category, priority


# ============================================================
# MAIN ENDPOINT  POST /api/ai/process_complaint
# Body: { text, channel, customer_id (optional), subject (optional) }
# ============================================================
@customerse_api.route("/process_complaint", methods=["POST"])
def process_complaint():
    data        = request.get_json(force=True)
    text        = (data.get("text") or "").strip()
    channel     = data.get("channel", "Direct")
    customer_id = data.get("customer_id")          # optional – set when logged-in customer sends
    subject_in  = (data.get("subject") or "").strip()  # optional pre-filled subject

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # ── 1. Preprocess ────────────────────────────────────────
    cleaned_text = preprocessor.clean_text(text)
    sentiment    = preprocessor.get_sentiment(text)

    # ── 2. LLM or ML path ────────────────────────────────────
    gemini = get_gemini_model()

    if gemini:
        is_valid = llm_fraud_detection(text, gemini)

        if not is_valid:
            category       = "Wrong Complain"
            priority       = "None"
            summary        = "Invalid or spam complaint detected."
            recommendation = "Auto-action: Discard invalid or spam complaint."
        else:
            category       = llm_classify_category(text, sentiment, gemini) or "Other"
            priority       = llm_predict_priority(text, category, sentiment, gemini) or "Medium"
            summary        = llm_generate_summary(text, gemini)
            recommendation = get_llm_recommendation(text, category, priority, sentiment, gemini)
    else:
        if not ml_models_loaded:
            return jsonify({"error": "No LLM API key and ML models not found."}), 500
        category, priority = ml_fallback_classify(cleaned_text, sentiment)
        summary        = cleaned_text[:60] + "..."
        recommendation = (
            "Auto-action: Discard invalid or spam complaint."
            if category == "Wrong Complain"
            else f"Auto-action: Escalate to {category} operations team."
        )

    # ── 3. Derive subject from summary if not provided ───────
    subject = subject_in or summary

    # ── 4. Persist to DB ─────────────────────────────────────
    ai_confidence = round(85.0 if len(text) > 20 else 45.0, 2)
    ticket_id = None

    try:
        ticket_id = insert_complaint(
            customer_id        = customer_id,
            subject            = subject,
            category           = category,
            complaint_text     = text,
            priority           = priority,
            recommended_action = recommendation,
            ai_confidence      = ai_confidence,
            complaint_source   = channel,
        )
    except Exception as e:
        print(f"DB save error (non-fatal): {e}")

    # ── 5. Return enriched response ───────────────────────────
    return jsonify({
        "ticket_id":        str(ticket_id) if ticket_id else None,
        "original_text":    text,
        "cleaned_text":     cleaned_text,
        "sentiment_score":  round(float(sentiment), 2),
        "subject":          subject,
        "category":         category,
        "priority":         priority,
        "channel":          channel,
        "summary":          summary,
        "recommendation":   recommendation,
        "ai_confidence":    ai_confidence,
        "timestamp":        datetime.now().strftime("%d %b %Y, %I:%M %p"),
    }), 201


# ============================================================
# ESCALATE  PUT /api/ai/escalate/<complaint_id>
# Sets priority = Critical and status = Escalated in DB
# ============================================================
@customerse_api.route("/escalate/<complaint_id>", methods=["PUT"])
def escalate_complaint(complaint_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB unavailable"}), 500
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE complaints
            SET priority = 'Critical',
                status   = 'Escalated',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, priority, status
        """, (complaint_id,))
        row = cur.fetchone()
        conn.commit()
        if not row:
            return jsonify({"error": "Complaint not found"}), 404
        return jsonify({
            "message":  "Complaint escalated to Critical.",
            "id":       str(row[0]),
            "priority": row[1],
            "status":   row[2],
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()