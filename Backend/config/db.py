import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    try:
        url = os.getenv("DATABASE_URL")
        if not url:
            print("❌ Error: DATABASE_URL not found in environment variables.")
            return None
        # Add connect timeout to avoid hanging forever on Neon cold starts
        return psycopg2.connect(url, connect_timeout=10)
    except Exception as e:
        # Check if it's a DNS/Host error to give a better tip
        if "translate host name" in str(e):
            print(f"❌ Database DNS Error: Your computer can't find the host. Tip: Check your internet or ensure the hostname in .env is correct.")
        elif "Authentication timed out" in str(e):
            print(f"⚠️ Database Auth Timeout: Neon DB cold-start. Retrying once...")
            try:
                return psycopg2.connect(url, connect_timeout=15)
            except Exception as retry_err:
                print(f"❌ Retry also failed: {retry_err}")
                return None
        else:
            print(f"❌ Database Connection Error: {e}")
        return None
