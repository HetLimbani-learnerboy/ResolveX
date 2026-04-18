"""
services/gemini_service.py
Wrapper around the Google Gemini API.
Uses google-generativeai SDK.
"""

import google.generativeai as genai
import os
from config.settings import GEMINI_API_KEY

# Initialise once at import time
genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-1.5-flash")

# In-memory session store  { session_id: ChatSession }
_sessions: dict = {}


def get_ai_suggestion(subject: str, category: str, complaint_text: str) -> str:
    """
    Given a complaint's details, ask Gemini to analyse it and suggest
    improvements or resolution steps.
    """
    prompt = f"""You are ResolveX AI, a professional complaint resolution assistant.

A customer has filed the following complaint:
- Subject: {subject}
- Category: {category}
- Details: {complaint_text}

Please provide:
1. A brief assessment of the complaint's clarity and completeness.
2. Two or three concrete suggestions to strengthen or resolve it.
3. An estimated priority level (Low / Medium / High / Critical) with reasoning.

Keep the response concise, empathetic, and actionable (max 200 words)."""

    response = _model.generate_content(prompt)
    return response.text.strip()


def chat_with_context(session_id: str, user_message: str, context: dict | None = None) -> str:
    """
    Multi-turn chat with optional complaint context injected on first message.
    """
    if session_id not in _sessions:
        system_intro = (
            "You are ResolveX AI, a helpful and empathetic complaint resolution assistant. "
            "You help customers file, refine, and track complaints effectively. "
            "Be concise, professional, and solution-oriented."
        )
        if context:
            system_intro += (
                f"\n\nThe customer is discussing a complaint with the following details:\n"
                f"- Subject: {context.get('subject', 'N/A')}\n"
                f"- Category: {context.get('category', 'N/A')}\n"
                f"- Details: {context.get('complaint_text', 'N/A')}\n"
                "Use this context to give relevant, specific advice."
            )
        chat = _model.start_chat(history=[
            {"role": "user", "parts": [system_intro]},
            {"role": "model", "parts": ["Understood! I'm ready to help with this complaint."]}
        ])
        _sessions[session_id] = chat

    chat = _sessions[session_id]
    response = chat.send_message(user_message)
    return response.text.strip()