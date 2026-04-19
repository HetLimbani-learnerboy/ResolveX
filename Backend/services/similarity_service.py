import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from config.db import get_connection
from ml.preprocessing import TextPreprocessor

def calculate_recurrence_stats(threshold=0.8):
    """
    Calculates the Recurrence Score and groups complaints into similarity clusters.
    Score = (Number of Similar Complaints / Total Complaints) * 100
    """
    conn = get_connection()
    if not conn:
        return {"score": 0.0, "clusters": []}

    try:
        cur = conn.cursor()
        cur.execute("SELECT id, subject, category, complaint_text FROM complaints")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return {"score": 0.0, "clusters": []}

        # Prepare Data
        df = pd.DataFrame(rows, columns=['id', 'subject', 'category', 'text'])
        total_complaints = len(df)

        # Preprocess
        preprocessor = TextPreprocessor()
        df['cleaned'] = df['text'].apply(preprocessor.clean_text)

        # Vectorize
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, 'ml', 'trained_models', 'tfidf_vectorizer.pkl')
        
        if not os.path.exists(model_path):
            print("⚠️ Similarity Service Warning: TF-IDF model not found.")
            return {"score": 0.0, "clusters": []}

        tfidf = joblib.load(model_path)
        # We transform based on the trained vocabulary
        X = tfidf.transform(df['cleaned'])

        # Similarity Matrix
        sim_matrix = cosine_similarity(X)

        # Identify Similar Pairs
        recurring_indices = set()
        clusters = []
        visited = set()

        for i in range(total_complaints):
            if i in visited:
                continue
            
            # Find all complaints similar to i
            similar_to_i = np.where(sim_matrix[i] > threshold)[0]
            
            # If there's more than one (itself excluded), it's a recurring issue
            if len(similar_to_i) > 1:
                cluster_ids = [df.iloc[idx]['id'] for idx in similar_to_i]
                representative_subject = df.iloc[i]['subject'] or df.iloc[i]['text'][:40]
                
                clusters.append({
                    "topic": str(representative_subject),
                    "count": int(len(similar_to_i)),
                    "category": str(df.iloc[i]['category']),
                    "ids": [str(cid) for cid in cluster_ids]
                })
                
                for idx in similar_to_i:
                    recurring_indices.add(idx)
                    visited.add(idx)
            else:
                visited.add(i)

        similar_count = len(recurring_indices)
        recurrence_score = (similar_count / total_complaints) * 100 if total_complaints > 0 else 0

        # Sort clusters by size
        clusters = sorted(clusters, key=lambda x: x['count'], reverse=True)

        return {
            "score": round(recurrence_score, 2),
            "total_complaints": total_complaints,
            "similar_complaints": similar_count,
            "clusters": clusters
        }

    except Exception as e:
        print(f"❌ Similarity Service Error: {e}")
        return {"score": 0.0, "clusters": [], "error": str(e)}
