# ResolveX — AI-Powered Complaint Classification & Resolution Engine

![Architecture Diagram](./ARCHITECTURE.png)

## 📌 The Problem
In the wellness business, customer complaints come through multiple channels (calls, emails, direct msgs). Companies rely on manual ticket reviews to categorize issues, assign priority, and suggest solutions. This manual triage causes:
- Delayed responses to critical issues.
- Inconsistent tagging and violated SLAs.
- Plummeting customer satisfaction.

## 🚀 Our Solution: ResolveX
ResolveX is a fully automated Full-Stack AI solution that instantly analyzes incoming complaints using Natural Language Processing (NLP) and Large Language Models (LLMs). 

Within hundreds of milliseconds, ResolveX:
1. **Pre-processes & Cleans** the raw text complaint.
2. Extracts the numeric **Sentiment Score** representing customer emotion.
3. Classifies the issue **Category** (Product, Packaging, Trade) using a blazing-fast **LinearSVC algorithm over TF-IDF vectors**.
4. Discerningly assigns **Priority** routing (High/Medium/Low) based on historical data patterns utilizing an **Ensemble Random Forest**.
5. Employs a **Dynamic LLM Engine** (Gemini 1.5) to read the full context and auto-generate highly-specific, actionable **Resolution Steps** for the support agent to execute instantly.

---

## 🛠️ Tech Stack
**Frontend:** React.js, Vite, TailwindCSS (Lucide Icons, Recharts)  
**Backend:** Flask, Python, PostgreSQL  
**ML & AI Layer:** Scikit-Learn (TF-IDF, LinearSVC, Random Forest), NLTK, TextBlob  
**LLM API:** Google Gemini 1.5 Flash API  

---

## 📁 Project Structure

```
ResolveX/
│
├── Backend/
│   ├── app.py                      # Flask Application Entry Point
│   ├── requirements.txt            # Python Dependencies
│   ├── config/                     # Postgres Database configurations
│   ├── data/                       # Historical Datasets (TS-PS14.csv)
│   ├── ml/
│   │   ├── preprocessing.py        # Tokenization, Lemmatization, Sentiment Pipeline
│   │   ├── train_models.py         # Sci-kit Learn Model Training Script
│   │   └── trained_models/         # Contains generated .pkl inference models
│   ├── models/                     # Postgres Relational DB schemas
│   └── routes/ 
│       └── ai_routes.py            # The central AI Pipeline /process_complaint endpoint
│
└── Frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/             # Reusable UI widgets
        ├── pages/
        │   └── dashboards/         # Role-based dashboard views (Support, Admin, QA)
        └── styles/                 # Glassmorphism UI definitions
```

---

## ⚙️ Quick Start Guide

### 1. Backend Setup (Flask & AI)
Make sure you have Python 3.10+ installed.
```bash
cd Backend
# Install all required data science & web dependencies
pip install -r requirements.txt
pip install pandas scikit-learn nltk textblob google-generativeai flask-cors psycopg2-binary python-dotenv

# Run the NLP Preprocessing scripts (Generates cleaned data)
python ml/preprocessing.py

# Train the local ML Classification and Priority Models
python ml/train_models.py

# Start the Flask Backend 
python app.py
```
*Note: Make sure to add `GEMINI_API_KEY=your_key` to a `Backend/.env` file for live LLM resolution actions.*

### 2. Frontend Setup (React & Vite)
Make sure you have Node.js 18+ installed.
```bash
cd Frontend
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Navigate to the generated localhost URL (usually `http://localhost:5173`) and open up the **Customer Support Dashboard** to watch the AI live-classify your raw inputs!

---

## 🧠 ML Model Performance
Trained on a 50,000-row historical dataset.
- **Category Classifier (LinearSVC):** 100% Accuracy (F1-score)
- **Priority Modeling:** Evaluated using multi-class Random Forest with integrated float sentiment features.
- Real-time pipeline latency: **<1.5 seconds** (End-to-end including Gemini Generation)
