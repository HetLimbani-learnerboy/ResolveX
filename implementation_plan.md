# AI-Powered Complaint Classification & Resolution Engine — ML Training Plan

## Overview

Based on the provided system architecture diagram and problem statement, your role is to build the **DATA INGESTION & PREPROCESSING** and **AI / ML INTELLIGENCE LAYER**. 

The dataset (`backend/data/TS-PS14.csv`) contains 50,000 records. We will build a pipeline that aligns perfectly with the architecture diagram. For classification and priority, we will use fast traditional ML models. For the **Recommendation Engine**, we will use an **LLM API** as the core reasoning engine to generate dynamic next steps.

---

## Architecture-Aligned ML Pipeline

### 1. Data Ingestion & Preprocessing Module

#### [NEW] [ml/preprocessing.py](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/ml/preprocessing.py)

Implements the data preparation logic outlined in the architecture:
- **Remove Noise / Stopwords:** Standard NLP cleanup using `nltk`.
- **Tokenization / Cleaning:** Regular expressions and lemmatization.
- **Spell Correction:** Standardizing misspelled words.
- **Sentiment Detection:** Using lightweight NLP (`TextBlob` or `VADER`) to extract sentiment during new complaint inference.

---

### 2. AI / ML Intelligence Layer (4 Core Modules)

#### [NEW] [ml/train_models.py](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/ml/train_models.py)
This script will train the Classification and Priority models based on historical data.

**Module 2.1: Complaint Classification (Traditional ML)**
- **Goal:** Classify into Product Issue, Packaging Issue, Trade Inquiry.
- **Approach:** Extract features using `TF-IDF` and train a lightweight ensemble (`Random Forest` or `XGBoost`). Fast inference for real-time dashboards.
- **Artifact:** `category_classifier.pkl`, `tfidf_vectorizer.pkl`

**Module 2.2: Priority Prediction & SLA Risk (Traditional ML)**
- **Goal:** Predict Priority (High, Medium, Low) and assign SLA Risk Score (High=4h, Medium=24h, Low=72h).
- **Approach:** Train an `XGBoost` classifier using text features + sentiment. 
- **Artifact:** `priority_classifier.pkl`

**Module 2.3: Fraud / Duplicate Detection (Vector Similarity)**
- **Goal:** Identify similar complaints, repeat customers, and duplicate cases.
- **Approach:** Compute `TF-IDF` cosine similarity. We will build a quick index to check if an incoming complaint has >90% similarity to an existing active complaint.
- **Artifact:** `similarity_index.pkl`

#### [NEW] [ml/llm_recommender.py](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/ml/llm_recommender.py)
**Module 2.4: LLM-Powered Recommendation Engine**
- **Goal:** Suggest dynamic, specific actions (e.g., Replace Product, Refund, Escalate QA, Follow-up Call).
- **Approach:** Instead of training a model from scratch, we will integrate an LLM API (e.g., Google Gemini or OpenAI). 
- **Flow:** We will construct a dynamic prompt containing the complaint context:
  `"Given the complaint: '{text}', which is categorized as '{category}' with a '{priority}' priority and '{sentiment}' sentiment. Generate 3 specific, actionable resolution steps for the customer support executive."`
- The LLM will act as the reasoning engine to return highly accurate, customized next steps.

---

### 3. Evaluation & Reporting

#### [NEW] [ml/evaluate.py](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/ml/evaluate.py)
Generates necessary evaluation metrics for the classical ML models (Category/Priority) to prove robustness.
- Confusion Matrices, F1-Scores.

---

### 4. Integration into Flask Backend

#### [NEW] [routes/ai_routes.py](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/routes/ai_routes.py)
Creates an end-to-end API route `POST /api/ai/process_complaint` that ties the whole diagram together:
1. Accepts raw text.
2. Passes through `preprocessing.py` -> Cleans text, extracts sentiment.
3. Checks `Module 2.3` for Duplicates.
4. Passes to `Module 2.1` -> gets **Category**.
5. Passes to `Module 2.2` -> gets **Priority** & SLA deadline.
6. Calls `Module 2.4` (LLM API) -> passes `(text, category, priority)` and receives the **Recommendation Engine** JSON response.
7. Returns complete JSON payload to be saved to DB layer.

#### [MODIFY] [app.py](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/app.py)
Register the new route.

#### [MODIFY] [requirements.txt](file:///c:/Users/anujr/OneDrive/Desktop/ResolveX/Backend/requirements.txt)
Adding stack libraries:
```
scikit-learn
xgboost
nltk
pandas
numpy
textblob
google-generativeai  # Or openai depending on selected key
```

---

## Open Questions

1. **LLM Provider:** Should we use `google-generativeai` (Gemini API) or `openai` for the reasoning engine? (I will set it up to read an API key from your `.env` file).

## Verification Plan
1. Ensure the training scripts successfully process `TS-PS14.csv` and output the `.pkl` models for Category and Priority.
2. Verify that the LLM Recommender correctly receives the predicted Category and Priority and generates actionable steps via `POST /api/ai/process_complaint`.
3. Ensure the response format is structured nicely for the Customer Support Executive dashboard.
