# ==========================================
# models/complaint_model.py
# ==========================================

from config.db import get_connection

def create_complaint_table():
    conn = get_connection()
    if not conn:
        return
        
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


def insert_complaint(customer_id=None, subject=None, category=None, complaint_text=None, priority="Medium", recommended_action=None, ai_confidence=None, complaint_source="Web"):
    conn = get_connection()
    if not conn:
        print("⚠️ Warning: Cannot insert complaint without DB. Returning fake ID for demo.")
        import uuid
        return str(uuid.uuid4())
        
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO complaints (
            customer_id,
            subject,
            category,
            complaint_text,
            priority,
            recommended_action,
            ai_confidence,
            complaint_source
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (customer_id, subject, category, complaint_text, priority, recommended_action, ai_confidence, complaint_source))
    
    ticket_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return ticket_id


def get_complaints_by_customer(customer_id):
    conn = get_connection()
    if not conn:
        return []

    cur = conn.cursor()
    cur.execute("""
        SELECT id, subject, category, priority, status, created_at
        FROM complaints
        WHERE customer_id = %s
        ORDER BY created_at DESC
    """, (customer_id,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    # Map to list of dicts
    complaints = []
    for row in rows:
        complaints.append({
            "id": row[0],
            "subject": row[1],
            "category": row[2],
            "priority": row[3],
            "status": row[4],
            "created_at": row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else None
        })
    return complaints


def get_all_complaints():
    conn = get_connection()
    if not conn:
        return []

    cur = conn.cursor()
    cur.execute("""
        SELECT id, subject, category, priority, status, created_at, complaint_text, ai_confidence, recommended_action, complaint_source
        FROM complaints
        ORDER BY created_at DESC
    """)
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    # Lazy load preprocessor to avoid circular dependencies if any
    from ml.preprocessing import TextPreprocessor
    preprocessor = TextPreprocessor()
    
    complaints = []
    for row in rows:
        priority = row[3] if row[3] else "Medium"
        cat = row[2] if row[2] else "Uncategorized"
        text = row[6] if row[6] else ""
        
        # Dynamically calculate the sentiment score here to show real data, 
        # since it's not historically stored in the DB schema.
        sentiment_score = preprocessor.get_sentiment(text)
        
        # Round it to 2 decimal places for better display
        sentiment_score = round(sentiment_score, 2)
        
        complaints.append({
            "id": row[0],
            "subject": row[1],
            "category": cat,
            "priority": priority,
            "status": row[4],
            "timestamp": row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else None,
            "complaint_text": text,
            "summary": row[1] or (text[:50] + "..." if text else ""), 
            "sentiment_score": sentiment_score, 
            "ai_confidence": float(row[7]) if row[7] else None,
            "recommendation": row[8],
            "original_text": text,
            "channel": row[9]
        })
    return complaints