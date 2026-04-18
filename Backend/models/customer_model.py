# ==========================================
# models/customer_model.py
# ==========================================

from config.db import get_connection


def create_customer_table():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL,
            otp VARCHAR(10),
            otp_created_at TIMESTAMP,
            phone VARCHAR(20),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()
    conn.close()