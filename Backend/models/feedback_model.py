# ==========================================
# models/feedback_model.py
# ==========================================

from config.db import get_connection


def create_feedback_table():
    conn = get_connection()
    if not conn:
        print("⚠️ Warning: Cannot create feedback table without DB connection.")
        return

    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
            customer_id UUID REFERENCES customers(id),

            rating INTEGER CHECK (rating >=1 AND rating <=5),
            feedback_text TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()
    conn.close()