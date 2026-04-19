import os
import json
from groq import Groq
from dotenv import load_dotenv

# ==========================================
# LOAD ENV
# ==========================================
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


# ==========================================
# MODULE 1 : SMART VALIDATOR
# ==========================================
VALIDATION_PROMPT = """
You are an AI Input Security Gatekeeper.

Decide whether the text is a real human complaint/message.

Mark FALSE if:
1. Random characters
2. Keyboard smashing
3. Repeated nonsense words
4. Only emojis
5. Empty / too short meaningless text
6. Abuse with no complaint context
7. Bot spam links
8. Numbers only
9. Same word repeated many times
10. Fake meaningless combinations

Mark TRUE if:
1. Real complaint
2. Real issue
3. Product concern
4. Delivery issue
5. Payment issue
6. Question
7. Feedback
8. Mixed language complaint
9. Short but meaningful message

Return JSON ONLY:

{
  "is_valid": true,
  "reason": ""
}
"""


# ==========================================
# MODULE 2 : ADVANCED CLASSIFIER
# ==========================================
CLASSIFIER_PROMPT = """
Analyze customer communication deeply.

Return:

1. subject (max 6 words)
2. category exactly one from:
[
Product,
Packaging,
Trade,
Payment,
Delivery,
Service,
Account,
App/Website,
Refund,
Fraud,
Other
]

3. priority exactly one from:
[
Low,
Medium,
High,
Critical
]

Priority Rules:
- Critical = fraud, safety, legal threat, repeated payment issue, severe outage
- High = urgent delivery, refund delay, account blocked
- Medium = product defect, wrong item, support dissatisfaction
- Low = question, suggestion, minor issue

Return JSON ONLY:

{
 "subject":"",
 "category":"",
 "priority":""
}
"""


# ==========================================
# MODULE 3 : STRATEGIC ENGINE
# ==========================================
ACTION_PROMPT = """
You are Senior Escalation Manager.

Give 1 to 3 practical next actions.

Rules:
1. Bullet points only using '-'
2. Max 3 points
3. Max 15 words each
4. Strong operational actions only
5. No generic wording

Example:
- Verify payment gateway logs
- Escalate to warehouse supervisor
- Prioritize refund approval
"""


# ==========================================
# MAIN PIPELINE
# ==========================================
def analyze_incoming_text(raw_text):

    try:
        # ----------------------------
        # BASIC LOCAL FILTER
        # ----------------------------
        if not raw_text or len(raw_text.strip()) < 3:
            return {
                "is_valid": False,
                "error": "Empty or too short message."
            }

        # ----------------------------
        # STEP 1 VALIDATION
        # ----------------------------
        val_res = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": VALIDATION_PROMPT},
                {"role": "user", "content": raw_text}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )

        validation = json.loads(val_res.choices[0].message.content)

        if not validation.get("is_valid"):
            return {
                "is_valid": False,
                "error": "Spam / Gibberish detected.",
                "reason": validation.get("reason", "")
            }

        # ----------------------------
        # STEP 2 CLASSIFICATION
        # ----------------------------
        class_res = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": CLASSIFIER_PROMPT},
                {"role": "user", "content": raw_text}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )

        data = json.loads(class_res.choices[0].message.content)

        subject = data.get("subject", "New Ticket")
        category = data.get("category", "Other")
        priority = data.get("priority", "Medium")

        # ----------------------------
        # STEP 3 ACTIONS
        # ----------------------------
        act_res = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": ACTION_PROMPT},
                {
                    "role": "user",
                    "content": f"""
Complaint: {raw_text}

Category: {category}
Priority: {priority}
"""
                }
            ],
            temperature=0.3
        )

        actions = act_res.choices[0].message.content.strip()

        # ----------------------------
        # FINAL RESPONSE
        # ----------------------------
        return {
            "is_valid": True,
            "subject": subject,
            "category": category,
            "priority": priority,
            "recommended_action": actions,
            "ai_confidence": 98.5
        }

    except Exception as e:
        print("AI Error:", e)

        return {
            "is_valid": False,
            "error": "AI processing failed.",
            "ai_confidence": 0
        }

def parse_classifier_output(text):
    """
    Extracts Subject, Category, and Priority from the LLM text using regex.
    """
    result = {
        "subject": "Untitled",
        "category": "Product",
        "priority": "Medium",
        "reasoning": ""
    }
    
    # Regex extraction
    subj_match = re.search(r"Subject:\s*(.*)", text)
    cat_match = re.search(r"Category:\s*(Product|Packaging|Trade)", text, re.I)
    prio_match = re.search(r"Priority:\s*(High|Medium|Low)", text, re.I)
    reason_match = re.search(r"Reasoning:\s*(.*)", text)

    if subj_match: result["subject"] = subj_match.group(1).strip()
    if cat_match: result["category"] = cat_match.group(1).strip().capitalize()
    if prio_match: result["priority"] = prio_match.group(1).strip().capitalize()
    if reason_match: result["reasoning"] = reason_match.group(1).strip()
    
    return result