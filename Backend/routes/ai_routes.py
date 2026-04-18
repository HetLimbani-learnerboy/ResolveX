from flask import Blueprint, request, jsonify
import os
import joblib
import pandas as pd
from scipy.sparse import hstack
from ml.preprocessing import TextPreprocessor
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

ai_bp = Blueprint("ai_bp", __name__)

# Load models safely
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_dir = os.path.join(base_dir, 'ml', 'trained_models')

# Load globally to keep API fast
try:
    tfidf = joblib.load(os.path.join(model_dir, 'tfidf_vectorizer.pkl'))
    cat_model = joblib.load(os.path.join(model_dir, 'category_classifier.pkl'))
    cat_enc = joblib.load(os.path.join(model_dir, 'category_encoder.pkl'))
    prio_model = joblib.load(os.path.join(model_dir, 'priority_classifier.pkl'))
    prio_enc = joblib.load(os.path.join(model_dir, 'priority_encoder.pkl'))
    models_loaded = True
except Exception as e:
    print(f"Warning: Models not loaded. {e}")
    models_loaded = False

preprocessor = TextPreprocessor()

def get_llm_recommendation(text, category, priority, sentiment):
    """Hits the Gemini API to get a recommendation. Fails gracefully to a rule-based fallback."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "":
        return f"Auto-action: Escalate to {category} operations team."
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        You are an expert Customer Support AI.
        A customer submitted the following complaint:
        "{text}"
        
        Our ML system classified this as:
        Category: {category}
        Priority: {priority}
        Sentiment Score: {sentiment} (-1 is angry, 1 is happy)
        
        Provide 1 short, highly actionable next step (max 10 words) for the support agent to resolve this. Do not provide polite fluff, just the action.
        """
        response = model.generate_content(prompt)
        return response.text.replace('"', '').strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        return f"Auto-action: Review priority and assign to {category} team."

@ai_bp.route("/process_complaint", methods=["POST"])
def process_complaint():
    if not models_loaded:
        return jsonify({"error": "ML models not found. Please train models first."}), 500
        
    data = request.json
    text = data.get("text", "")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    # 1. Preprocess
    cleaned_text = preprocessor.clean_text(text)
    sentiment = preprocessor.get_sentiment(text)
    
    # 2. Extract Features
    X_tfidf = tfidf.transform([cleaned_text])
    
    # 3. Predict Category
    cat_pred_idx = cat_model.predict(X_tfidf)[0]
    category = cat_enc.inverse_transform([cat_pred_idx])[0]
    
    # 4. Predict Priority
    X_combined = hstack([X_tfidf, [[sentiment]]])
    prio_pred_idx = prio_model.predict(X_combined)[0]
    priority = prio_enc.inverse_transform([prio_pred_idx])[0]
    
    # 5. Get Recommendation String
    recommendation = get_llm_recommendation(text, category, priority, sentiment)
    
    return jsonify({
        "original_text": text,
        "cleaned_text": cleaned_text,
        "sentiment_score": round(sentiment, 2),
        "category": category,
        "priority": priority,
        "recommendation": recommendation
    })
