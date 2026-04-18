# ==========================================
# models/user_model.py
# ==========================================

from config.db import get_connection

def create_user_table():
    conn = get_connection()
    if not conn:
        print("⚠️ Skipping Table Creation: No database connection.")
        return

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
    
    # If database is down, check for "Demo" login fallback
    if not conn:
        print(f"⚠️ Database Offline: Using internal demo-check for {email}")
        # Allow hardcoded logins for development if DB is failing
        demo_users = {
            "admin@resolvex.com": ("demo-id-1", "Admin User", "admin@resolvex.com", "password", "admin", "123", True, True),
            "customer@resolvex.com": ("demo-id-2", "Customer User", "customer@resolvex.com", "password", "customer", "456", True, True),
            "support@resolvex.com": ("demo-id-3", "Support Executive", "support@resolvex.com", "password", "support", "789", True, True),
        }
        return demo_users.get(email)

    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, email, password_hash, role, phone, is_active, is_verified 
        FROM users 
        WHERE email = %s
    """, (email,))

    user = cur.fetchone()
    cur.close()
    conn.close()
    return user

def insert_user(full_name, email, password_hash, role, phone, is_verified):
    conn = get_connection()
    if not conn:
        print("❌ Error: Cannot insert user without database connection.")
        return None

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