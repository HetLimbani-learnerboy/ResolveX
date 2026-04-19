import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ API Key Not Found in .env file")
else:
    try:
        client = Groq(api_key=api_key)

        # UPDATED: Using llama3.1-8b-instant (Standard for 2026)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": "Hello! Confirm if you are online."}
            ]
        )

        print("✅ API Key is Working Properly!")
        print("Model Response:", response.choices[0].message.content)

    except Exception as e:
        print("❌ API Error:", e)