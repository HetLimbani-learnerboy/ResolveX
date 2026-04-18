# ==========================================
# models/user_model.py
# ==========================================

from config.db import get_connection


def create_user_table():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) DEFAULT 'executive',
            phone VARCHAR(20),
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()
    conn.close()

def check_email_exists(email):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM users WHERE email = %s
    """, (email,))

    exists = cur.fetchone() is not None

    cur.close()
    conn.close()

    return exists


def insert_user(full_name, email, password_hash, role, phone, is_verified):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO users (
            full_name,
            email,
            password_hash,
            role,
            phone,
            is_verified
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, full_name, email, role, is_verified
    """, (full_name, email, password_hash, role, phone, is_verified))

    user = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return user