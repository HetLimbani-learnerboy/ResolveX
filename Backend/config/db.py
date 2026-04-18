import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    try:
        return psycopg2.connect(os.getenv("DATABASE_URL"))
    except psycopg2.OperationalError as e:
        print(f"Database Connection Error: {e}")
        raise Exception("Database is currently offline or unreachable. Please check your DATABASE_URL in .env.")