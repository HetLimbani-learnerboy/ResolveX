import os
import uuid
from dotenv import load_dotenv
from groq import Groq

# ==========================================
# CONFIG
# ==========================================
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

# Optimal 2026 Models
PRIMARY_MODEL = "llama-3.3-70b-versatile"
BACKUP_MODEL = "llama-3.1-8b-instant" # Use 8b as backup for speed/reliability

# In-memory dictionary to store conversation history
chat_sessions = {}

# ==========================================
# SYSTEM MANDATES (The 10 Rules)
# ==========================================
SYSTEM_PROMPT = """
You are the ResolveX AI Customer Support Assistant. Follow these 10 mandates strictly:
1. Help users with complaints clearly and empathetically.
2. Explain ResolveX products and services (shipping/returns) accurately.
3. Summarize long complaint messages into actionable points.
4. Rewrite rude or angry complaints into professional business language.
5. Calm frustrated users using de-escalation techniques.
6. Suggest logical resolutions: (Refund -> Replacement -> Escalation).
7. Explain shipping/payment/logistics issues professionally.
8. Ask clarifying questions if the user's issue is vague.
9. Stay human, helpful, and concise.
10. Maximum 150 words per response.
"""

# ==========================================
# SAFE MODEL CALL (Generic Generator)
# ==========================================
def generate_text(prompt):
    """Used for one-off tasks like AI Analysis."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=600
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"⚠️ Primary Model Error: {e}")
        try:
            response = client.chat.completions.create(
                model=BACKUP_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=600
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return "ResolveX AI is currently over-capacity. Please try again in a minute."

# ==========================================
# AI COMPLAINT ANALYSIS (For the Form)
# ==========================================
def get_ai_suggestion(subject, category, complaint_text):
    """Analyzes complaint data to suggest a resolution to the agent."""
    prompt = f"""
    Analyze the following customer complaint:
    
    Subject: {subject}
    Category: {category}
    Complaint Detail: {complaint_text}
    
    Provide:
    1. Priority Level (Critical/High/Medium/Low)
    2. 2-sentence Summary
    3. Recommended Step-by-Step Resolution
    4. A Professional Rewrite for the official record
    """
    return generate_text(prompt)

# ==========================================
# CHATBOT WITH MEMORY (Contextual Chat)
# ==========================================
def chat_with_context(session_id, user_message, context=None):
    """Full chatbot with session memory and original complaint context."""
    if not session_id:
        session_id = str(uuid.uuid4())

    # Initialize New Session
    if session_id not in chat_sessions:
        history = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Inject specific complaint context if available
        if context:
            ctx_msg = (
                f"FACTS FOR THIS SESSION:\n"
                f"The user is discussing a complaint about '{context.get('subject')}' "
                f"in the '{context.get('category')}' category. "
                f"Original Text: {context.get('complaint_text')}"
            )
            history.append({"role": "system", "content": ctx_msg})
        
        chat_sessions[session_id] = history

    # Add the latest user message
    chat_sessions[session_id].append({"role": "user", "content": user_message})

    # SLIDING WINDOW MEMORY: Keep System Mandates + last 6 messages
    if len(chat_sessions[session_id]) > 10:
        # Keep instruction (0) and facts (1) if they exist
        headers = chat_sessions[session_id][:2] if context else chat_sessions[session_id][:1]
        recent = chat_sessions[session_id][-8:]
        chat_sessions[session_id] = headers + recent

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=chat_sessions[session_id],
            temperature=0.6,
            max_tokens=500
        )
        reply = response.choices[0].message.content.strip()
        chat_sessions[session_id].append({"role": "assistant", "content": reply})
        return reply

    except Exception as e:
        print(f"⚠️ Chat API Error: {e}")
        try:
            # Fallback to faster backup model
            response = client.chat.completions.create(
                model=BACKUP_MODEL,
                messages=chat_sessions[session_id],
                temperature=0.6,
                max_tokens=500
            )
            reply = response.choices[0].message.content.strip()
            chat_sessions[session_id].append({"role": "assistant", "content": reply})
            return reply
        except Exception:
            return "I'm experiencing a minor connection lag. Could you repeat that for me?"

# ==========================================
# CLEAR SESSION
# ==========================================
def clear_chat_session(session_id):
    if session_id in chat_sessions:
        del chat_sessions[session_id]
        return True
    return False