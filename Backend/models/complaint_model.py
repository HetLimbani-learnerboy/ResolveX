# ==========================================
# models/complaint_model.py
# ==========================================

from config.db import get_connection


def create_complaint_table():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
            executive_id UUID REFERENCES users(id) ON DELETE SET NULL,

            complaint_source VARCHAR(50) NOT NULL,
            subject VARCHAR(255),
            complaint_text TEXT NOT NULL,

            category VARCHAR(100),
            priority VARCHAR(20) DEFAULT 'Low',

            ai_confidence DECIMAL(5,2),
            recommended_action TEXT,

            status VARCHAR(30) DEFAULT 'Open',

            sla_deadline TIMESTAMP,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()
    conn.close()