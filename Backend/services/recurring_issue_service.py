# ==========================================================
# services/recurring_issue_service.py
# FULL AUTO RECURRING ISSUE ENGINE
# Reads complaints table -> LLM grouping -> saves recurring_issues
# ==========================================================

import os
import json
from groq import Groq
from dotenv import load_dotenv
from config.db import get_connection

# ==========================================================
# ENV
# ==========================================================
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


# ==========================================================
# LLM PROMPT
# ==========================================================
TREND_PROMPT = """
You are a complaint clustering analyst.

Analyze the complaint and return JSON only.

Rules:
1. Similar complaints must always get same issue_id
2. issue_id = lowercase with hyphen
3. cluster_name = readable short title
4. severity = Low / Medium / High / Critical

Examples:

Wrong product delivered
{
 "issue_id":"wrong-item-delivered",
 "cluster_name":"Wrong Item Complaints",
 "severity":"High"
}

Wet damaged package
{
 "issue_id":"wet-package-damage",
 "cluster_name":"Wet Package Damage",
 "severity":"Medium"
}

Login button spinning forever
{
 "issue_id":"app-login-spinner",
 "cluster_name":"Login Spinner Bug",
 "severity":"Critical"
}
"""


# ==========================================================
# SINGLE COMPLAINT -> LLM -> SAVE
# ==========================================================
def process_single_complaint(row):

    complaint_id = row[0]
    subject = row[1] or ""
    category = row[2] or "Other"
    complaint_text = row[3] or ""
    priority = row[4] or "Medium"
    status = row[5] or "Open"

    full_text = f"""
Subject: {subject}
Category: {category}
Priority: {priority}
Status: {status}
Complaint: {complaint_text}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": TREND_PROMPT},
                {"role": "user", "content": full_text}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )

        data = json.loads(response.choices[0].message.content)

        issue_id = data.get("issue_id", "general-issue")
        cluster_name = data.get("cluster_name", "General Complaints")
        severity = data.get("severity", "Medium")

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO recurring_issues
        (
            issue_id,
            cluster_name,
            category,
            total_count,
            severity,
            sample_subject,
            first_seen,
            last_seen
        )
        VALUES
        (
            %s,%s,%s,1,%s,%s,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )

        ON CONFLICT(issue_id)

        DO UPDATE SET
            total_count = recurring_issues.total_count + 1,
            last_seen = CURRENT_TIMESTAMP,
            severity = EXCLUDED.severity
        """, (
            issue_id,
            cluster_name,
            category,
            severity,
            subject
        ))

        conn.commit()
        cur.close()
        conn.close()

        return True

    except Exception as e:
        print("Recurring Error:", e)
        return False


# ==========================================================
# FULL TABLE PROCESS
# complaints -> recurring_issues
# ==========================================================
def build_recurring_groups():

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
        SELECT
            id,
            subject,
            category,
            complaint_text,
            priority,
            status
        FROM complaints
        ORDER BY created_at DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        # clear old grouped data
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM recurring_issues")

        conn.commit()
        cur.close()
        conn.close()

        success_count = 0

        for row in rows:
            ok = process_single_complaint(row)
            if ok:
                success_count += 1

        return {
            "success": True,
            "processed": success_count
        }

    except Exception as e:
        print("Build Error:", e)

        return {
            "success": False
        }


# ==========================================================
# DASHBOARD DATA
# ==========================================================
def get_recurring_dashboard():

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
        SELECT
            cluster_name,
            issue_id,
            category,
            severity,
            total_count,
            sample_subject,
            first_seen,
            last_seen

        FROM recurring_issues

        ORDER BY total_count DESC, last_seen DESC
        """)

        rows = cur.fetchall()

        data = []

        for row in rows:
            data.append({
                "cluster_name": row[0],
                "issue_id": row[1],
                "category": row[2],
                "severity": row[3],
                "count": row[4],
                "sample_subject": row[5],
                "first_seen": str(row[6]),
                "last_seen": str(row[7])
            })

        cur.close()
        conn.close()

        return data

    except Exception as e:
        print("Dashboard Error:", e)
        return []