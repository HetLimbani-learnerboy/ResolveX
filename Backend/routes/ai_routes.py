from flask import Blueprint, request, jsonify
import os
import json
from datetime import datetime
import joblib
import numpy as np
from scipy.sparse import hstack
from ml.preprocessing import TextPreprocessor
import google.generativeai as genai
from dotenv import load_dotenv
from routes.admin_routes import complaint_history

load_dotenv()

ai_bp = Blueprint("ai_bp", __name__)

# ============================================================
# ML Models (Fast Fallback when LLM API is unavailable)
# ============================================================
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_dir = os.path.join(base_dir, 'ml', 'trained_models')

try:
    tfidf = joblib.load(os.path.join(model_dir, 'tfidf_vectorizer.pkl'))
    cat_model = joblib.load(os.path.join(model_dir, 'category_classifier.pkl'))
    cat_enc = joblib.load(os.path.join(model_dir, 'category_encoder.pkl'))
    prio_model = joblib.load(os.path.join(model_dir, 'priority_classifier.pkl'))
    prio_enc = joblib.load(os.path.join(model_dir, 'priority_encoder.pkl'))
    ml_models_loaded = True
except Exception as e:
    print(f"Warning: ML fallback models not loaded. {e}")
    ml_models_loaded = False

preprocessor = TextPreprocessor()

# ============================================================
# LLM Engine Setup
# ============================================================
def get_gemini_model():
    """Returns a configured Gemini model instance. Returns None if no API key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "":
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

def parse_llm_json(raw_text):
    """Safely parse JSON from LLM response, stripping markdown fences."""
    raw = raw_text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()
    return json.loads(raw)

# ============================================================
# MODULE 1: LLM-Powered Fraud / Spam Detection
# ============================================================
def llm_fraud_detection(text, model):
    """
    Uses the LLM to determine if the complaint is valid or spam/gibberish.
    Returns True if the complaint is VALID, False if it's spam.
    """
    try:
        prompt = f"""You are a Fraud Detection AI for a customer support system.

Analyze the following text and determine if it is a VALID customer complaint or if it is spam, gibberish, random characters, or meaningless text.

Text: "{text}"

Rules:
- If the text contains any recognizable complaint, question, or feedback in any language → it is VALID.
- If the text is random characters, keyboard mashing, test input, or completely meaningless → it is SPAM.

Respond ONLY with valid JSON, no extra text:
{{"is_valid": true}} or {{"is_valid": false}}"""

        response = model.generate_content(prompt)
        result = parse_llm_json(response.text)
        return result.get("is_valid", True)
    except Exception as e:
        print(f"LLM Fraud Detection Error: {e}")
        return True  # Default to valid if LLM fails

# ============================================================
# MODULE 2: LLM-Powered Category Classification
# ============================================================
def llm_classify_category(text, sentiment, model):
    """
    Uses the LLM to deeply understand the complaint meaning 
    and assign the most accurate category — no keywords needed.
    """
    try:
        prompt = f"""You are an expert Complaint Classification AI for a wellness company.

Read the following customer complaint carefully and understand its core meaning:
---
{text}
---

Sentiment Score: {sentiment} (scale: -1.0 = very angry, 0.0 = neutral, 1.0 = happy)

Based on YOUR understanding of the complaint's meaning, assign the single most appropriate CATEGORY from this list:
- Product (product defect, quality issue, product not working, wrong product)
- Packaging (damaged box, poor packaging, crushed package, broken seal)
- Trade (bulk orders, wholesale inquiry, dealer request, business partnership)
- Payment (transaction failed, refund, overcharged, billing error, amount deducted)
- Delivery (late delivery, not delivered, wrong address, courier issue, tracking)
- Service (poor customer support, rude agent, no response, helpline issue)
- Account (login issue, password reset, OTP, profile problem, verification)
- App/Website (app crash, website bug, UI error, page not loading)
- Other (anything that doesn't clearly fit the above categories)

Respond ONLY with valid JSON, no extra text:
{{"category": "..."}}"""

        response = model.generate_content(prompt)
        result = parse_llm_json(response.text)
        return result.get("category", "Other")
    except Exception as e:
        print(f"LLM Classification Error: {e}")
        return None

# ============================================================
# MODULE 3: LLM-Powered Priority Prediction
# ============================================================
def llm_predict_priority(text, category, sentiment, model):
    """
    Uses the LLM to intelligently assign priority based on 
    complaint severity, urgency cues, and customer emotion.
    """
    try:
        prompt = f"""You are a Priority Assessment AI for customer support.

A customer submitted this complaint (Category: {category}):
---
{text}
---

Sentiment Score: {sentiment} (-1.0 = very angry, 0.0 = neutral, 1.0 = happy)

Assign a PRIORITY level based on these rules:
- High: Financial loss, safety risk, extremely angry customer, words like "urgent", "immediate", "unacceptable", strong negative emotion, or legal threats.
- Medium: Moderate frustration, standard complaints, general dissatisfaction.
- Low: Simple inquiries, feedback, mild tone, positive sentiment.

Respond ONLY with valid JSON, no extra text:
{{"priority": "High"}}, {{"priority": "Medium"}}, or {{"priority": "Low"}}"""

        response = model.generate_content(prompt)
        result = parse_llm_json(response.text)
        return result.get("priority", "Medium")
    except Exception as e:
        print(f"LLM Priority Error: {e}")
        return None

# ============================================================
# MODULE 5: LLM-Powered Summary Generator
# ============================================================
def llm_generate_summary(text, model):
    """
    Uses the LLM to generate a short 1-line summary of the complaint.
    This summary is displayed under the Issue Title in the dashboard.
    """
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
# MODULE 4: Recommendation Engine (UNTOUCHED — kept as is)
# ============================================================
def get_llm_recommendation(text, category, priority, sentiment):
    """Hits the Gemini API to get a recommendation only. Used when ML model is confident."""
    model = get_gemini_model()
    if not model:
        return f"Auto-action: Escalate to {category} operations team."
        
    try:
        prompt = f"""You are an expert Customer Support AI.
A customer submitted the following complaint:
"{text}"

Our ML system classified this as:
Category: {category}
Priority: {priority}
Sentiment Score: {sentiment} (-1 is angry, 1 is happy)

Provide 1 short, highly actionable next step (max 10 words) for the support agent to resolve this. Do not provide polite fluff, just the action."""

        response = model.generate_content(prompt)
        return response.text.replace('"', '').strip()
    except Exception as e:
        print(f"LLM Recommendation Error: {e}")
        return f"Auto-action: Review priority and assign to {category} team."

# ============================================================
# ML Fallback (used when LLM API key is missing)
# ============================================================
def ml_fallback_classify(cleaned_text, sentiment):
    """Uses traditional ML models as a fast fallback."""
    X_tfidf = tfidf.transform([cleaned_text])
    
    if X_tfidf.nnz == 0:
        return "Wrong Complain", "None"
    
    cat_pred_idx = cat_model.predict(X_tfidf)[0]
    category = cat_enc.inverse_transform([cat_pred_idx])[0]
    
    X_combined = hstack([X_tfidf, [[sentiment]]])
    prio_pred_idx = prio_model.predict(X_combined)[0]
    priority = prio_enc.inverse_transform([prio_pred_idx])[0]
    
    return category, priority

# ============================================================
# MAIN API ENDPOINT
# ============================================================
@ai_bp.route("/process_complaint", methods=["POST"])
def process_complaint():
    data = request.json
    text = data.get("text", "")
    channel = data.get("channel", "Direct")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    # 1. Preprocess text and extract sentiment
    cleaned_text = preprocessor.clean_text(text)
    sentiment = preprocessor.get_sentiment(text)
    
    # 2. Check if LLM is available
    gemini = get_gemini_model()
    
    if gemini:
        # ==============================
        # PRIMARY PATH: LLM Intelligence
        # ==============================
        
        # Module 1: Fraud / Spam Detection via LLM
        is_valid = llm_fraud_detection(text, gemini)
        
        if not is_valid:
            category = "Wrong Complain"
            priority = "None"
            summary = "Invalid or spam complaint detected."
            recommendation = "Auto-action: Discard invalid or spam complaint."
        else:
            # Module 2: Category Classification via LLM
            category = llm_classify_category(text, sentiment, gemini)
            if not category:
                category = "Other"
            
            # Module 3: Priority Prediction via LLM
            priority = llm_predict_priority(text, category, sentiment, gemini)
            if not priority:
                priority = "Medium"
            
            # Module 5: Summary Generator via LLM
            summary = llm_generate_summary(text, gemini)
            
            # Module 4: Recommendation Engine (UNTOUCHED)
            recommendation = get_llm_recommendation(text, category, priority, sentiment)
    else:
        # ==============================
        # FALLBACK PATH: ML Models
        # ==============================
        if not ml_models_loaded:
            return jsonify({"error": "No LLM API key and ML models not found."}), 500
        
        category, priority = ml_fallback_classify(cleaned_text, sentiment)
        
        summary = cleaned_text[:60] + "..."
        if category == "Wrong Complain":
            recommendation = "Auto-action: Discard invalid or spam complaint."
        else:
            recommendation = f"Auto-action: Escalate to {category} operations team."
    
    result = {
        "original_text": text,
        "cleaned_text": cleaned_text,
        "sentiment_score": round(sentiment, 2),
        "category": category,
        "priority": priority,
        "channel": channel,
        "summary": summary,
        "recommendation": recommendation,
        "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }
    
    # Push to shared complaint history for admin panel reports & exports
    result["id"] = f"TKT-{len(complaint_history) + 1001}"
    complaint_history.append(result)
    
    return jsonify(result)

