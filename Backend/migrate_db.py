from config.db import get_connection
import sys

def migrate():
    conn = get_connection()
    if not conn:
        print("Failed to connect")
        sys.exit(1)
    
    cur = conn.cursor()
    try:
        print("Updating complaints table...")
        cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS executive_id UUID REFERENCES users(id) ON DELETE SET NULL")
        cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        conn.commit()
        print("Successfully updated complaints table.")
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
