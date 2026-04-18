# ==========================================
# models/history_model.py
# ==========================================

from config.db import get_connection


def create_history_table():
    conn = get_connection()
    if not conn:
        print("⚠️ Warning: Cannot create history table without DB connection.")
        return

    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS complaint_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

            old_status VARCHAR(30),
            new_status VARCHAR(30),

            remarks TEXT,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()
    conn.close()