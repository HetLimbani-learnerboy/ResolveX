# ==========================================
# models/escalation_model.py
# ==========================================

from config.db import get_connection


def create_escalation_table():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS escalations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
            escalated_by UUID REFERENCES users(id),

            reason TEXT NOT NULL,

            escalated_to VARCHAR(100),
            status VARCHAR(30) DEFAULT 'Pending',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()
    conn.close()