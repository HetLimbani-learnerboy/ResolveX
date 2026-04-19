# ==========================================
# services/gemini_service.py
# FREE WORKING VERSION (2026)
# ==========================================

import google.generativeai as genai
import google.api_core.exceptions
import uuid

from config.settings import GEMINI_API_KEY


# ==========================================
# CONFIG
# ==========================================
genai.configure(api_key=GEMINI_API_KEY)

# FREE + WORKING MODELS
PRIMARY_MODEL = "gemini-2.0-flash"
BACKUP_MODEL = "gemini-2.0-flash-lite"

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 700
}

# Chat Memory
chat_sessions = {}


# ==========================================
# SYSTEM PROMPT
# ==========================================
SYSTEM_PROMPT = """
You are ResolveX AI Customer Support Assistant.

Your duties:
1. Help users with complaints.
2. Explain product information clearly.
3. Summarize long complaint messages.
4. Rewrite rude complaints professionally.
5. Calm frustrated users politely.
6. Suggest refund / replacement / escalation.
7. Explain shipping/payment issues.
8. Ask clarifying questions if unclear.
9. Stay human and concise.
10. Maximum 180 words.
"""


# ==========================================
# SAFE MODEL CALL
# ==========================================
def generate_text(prompt):
    try:
        model = genai.GenerativeModel(
            PRIMARY_MODEL,
            generation_config=generation_config
        )

        response = model.generate_content(prompt)

        return response.text.strip()

    except google.api_core.exceptions.ResourceExhausted:
        return "⚠️ AI usage limit reached. Please wait one minute."

    except Exception:
        try:
            model = genai.GenerativeModel(
                BACKUP_MODEL,
                generation_config=generation_config
            )

            response = model.generate_content(prompt)

            return response.text.strip()

        except Exception as e:
            return f"AI service temporarily unavailable."


# ==========================================
# AI SUGGESTION
# ==========================================
def get_ai_suggestion(subject, category, complaint_text):
    prompt = f"""
{SYSTEM_PROMPT}

Analyze this complaint:

Subject: {subject}
Category: {category}
Complaint: {complaint_text}

Give:

1. Priority Level
2. Short Summary
3. Recommended Resolution
4. Better Rewrite
"""

    return generate_text(prompt)


# ==========================================
# CHATBOT WITH MEMORY
# ==========================================
def chat_with_context(session_id, user_message, context=None):

    if not session_id:
        session_id = str(uuid.uuid4())

    # New Session
    if session_id not in chat_sessions:

        intro = SYSTEM_PROMPT

        if context:
            intro += f"""

Current Complaint Context:
Subject: {context.get('subject', '')}
Category: {context.get('category', '')}
Complaint: {context.get('complaint_text', '')}
"""

        model = genai.GenerativeModel(
            PRIMARY_MODEL,
            generation_config=generation_config
        )

        chat = model.start_chat(history=[
            {
                "role": "user",
                "parts": [intro]
            },
            {
                "role": "model",
                "parts": [
                    "Hello 👋 I am ResolveX AI. How may I help you?"
                ]
            }
        ])

        chat_sessions[session_id] = chat

    # Existing Session
    try:
        chat = chat_sessions[session_id]

        response = chat.send_message(user_message)

        return response.text.strip()

    except google.api_core.exceptions.ResourceExhausted:
        return "⚠️ AI is busy right now. Please retry shortly."

    except Exception:
        # fallback no-memory mode
        prompt = f"""
{SYSTEM_PROMPT}

User Message:
{user_message}
"""
        return generate_text(prompt)


# ==========================================
# CLEAR SESSION
# ==========================================
def clear_chat_session(session_id):
    if session_id in chat_sessions:
        del chat_sessions[session_id]
        return True
    return False


