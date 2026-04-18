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
        return psycopg2.connect(url)
    except Exception as e:
        # Check if it's a DNS/Host error to give a better tip
        if "translate host name" in str(e):
            print(f"❌ Database DNS Error: Your computer can't find the host. Tip: Check your internet or ensure the hostname in .env is correct.")
        else:
            print(f"❌ Database Connection Error: {e}")
        return None
