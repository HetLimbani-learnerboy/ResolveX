<div align="center">
  <br />
  <h1>🚀 ResolveX</h1>
  <h2>AI-Powered Customer Support & SLA Management Platform</h2>
  <p><strong>Hackathon Submission: Next-Generation CRM with Intelligent Ticket Routing</strong></p>
  <p>A hybrid intelligence platform combining machine learning and generative AI for real-time ticket classification, priority prediction, and automated customer support.</p>
</div>

---

## 📋 Table of Contents
- [🏆 Hackathon & Team Information](#-hackathon--team-information)
- [📖 Project Overview](#-project-overview)
- [🏗️ System Architecture](#-system-architecture)
- [🔄 Application Workflow](#-application-workflow)
- [💻 Technology Stack](#-technology-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [▶️ Running the Application](#-running-the-application)
- [📸 Project Gallery](#-project-gallery)
- [📚 Key Features](#-key-features)

---

## 🏆 Hackathon & Team Information

### Hackathon Details
- **Event Name:** Tark Shaastra · Lakshya 2.0
- **Category:** AI-Powered Complaint Classification & Resolution Recommendation Engine

### Team Information
**Team Name:** Hogwarts Tech Wizards

#### Team Members
| Name | Role |
|------|------|
| Het Limbani | Team Lead / Full-Stack Developer with AI/ML Development | 
| Ansh Patoliya | Full-Stack Developer | 
| Anuj Raval | Backend Developer with AI/ML Development | 

---

## 📖 Project Overview

**ResolveX** is an enterprise-grade Customer Support and Operations platform that revolutionizes ticket management through intelligent automation. Unlike traditional helpdesk systems, ResolveX embeds **Machine Learning natively within the request lifecycle** to:

- 🎯 **Classify** customer complaints into relevant categories in milliseconds
- 📊 **Predict** priority levels and assign dynamic SLA countdowns
- 🔍 **Detect** duplicate tickets, spam, and fraudulent requests
- 💡 **Recommend** tailored resolution steps using LLM-powered intelligence
- 📈 **Track** performance metrics across multiple operational dashboards

### Core Problem Solved
Manual ticket triage is time-consuming, inconsistent, and prone to human error. ResolveX eliminates these inefficiencies by automating the entire triage process while maintaining human oversight through specialized dashboards for different stakeholder roles.

### Key Value Propositions
- ⚡ **Real-Time Processing:** AI classification happens before human assignment
- 🎯 **Multi-Role Support:** Tailored dashboards for Customers, Managers, Executives, and QA teams
- 🔒 **Enterprise-Grade:** Production-ready architecture with PostgreSQL, JWT authentication, and robust API design
- 🤖 **Hybrid Intelligence:** Combines fast local ML models with advanced LLM capabilities

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

The following details the full-stack architecture, detailing how the unified frontend distributes to role-locked views, hits the Python middleware, and gets triaged by our proprietary Machine Learning engine.

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef backend fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef ai fill:#312e81,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef db fill:#064e3b,stroke:#f59e0b,stroke-width:2px,color:#fff;

    %% Frontend Tier
    subgraph Frontend [React / Vite Client Tier]
        C[Customer Portal]:::client
        M[Manager Dashboard]:::client
        E[Executive Console]:::client
        Q[QA Analytics Board]:::client
    end

    %% Backend Tier
    subgraph CoreBackend [Python Flask Core API]
        R[(Router & Auth)]:::backend
        Comp[Complaint Service]:::backend
        SLA[Dynamic SLA Calculator]:::backend
        QA[Feedback Mod]:::backend
    end

    %% AI Pipeline
    subgraph AIEngine [Hybrid Intelligence Engine]
        ML[Local Scikit-Learn Pipeline<br>Accuracy: >99.8%]:::ai
        Fraud[Spam & Fraud Filter]:::ai
        Rec[Recommendation Model]:::ai
        LLM[Google Gemini API<br>NL Summarization]:::ai
    end

    %% Database
    DB[(PostgreSQL Database)]:::db

    %% Connections
    C -->|JWT / REST| R
    M -->|JWT / REST| R
    E -->|JWT / REST| R
    Q -->|JWT / REST| R

    R --> Comp
    R --> QA
    
    Comp --> SLA
    Comp --> ML
    Comp --> Fraud
    Comp --> Rec
    Comp -.->|Complex NL Edge Cases| LLM
    
    SLA --> DB
    ML --> DB
    QA --> DB
```

---

### Component Descriptions

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Frontend** | Multi-role user interfaces | React 19, Vite, Recharts |
| **Auth Layer** | Secure JWT-based authentication | Flask + Custom JWT |
| **API Gateway** | Request routing and validation | Flask REST API |
| **Services** | Business logic and data processing | Python |
| **ML Pipeline** | Intelligent ticket processing | Scikit-Learn, XGBoost |
| **Database** | Persistent data storage | PostgreSQL |
| **LLM Integration** | Advanced text understanding | Google Gemini, Groq |

---

## 🔄 Application Workflow

### Data Flow Sequence

```mermaid
sequenceDiagram
    actor Customer as 👤 Customer
    participant Frontend as 🖥️ Frontend
    participant API as 🔌 API
    participant ML as 🤖 ML Engine
    participant LLM as 🧠 LLM Service
    participant DB as 🗄️ Database

    Customer->>Frontend: Submit Complaint
    Frontend->>API: POST /api/complaints with JWT
    API->>API: Validate & Authenticate
    API->>ML: Send text for processing
    ML->>ML: Preprocessing
    ML->>ML: Classification
    ML->>ML: Priority Prediction
    ML->>ML: Fraud Detection
    ML->>LLM: Request recommendations
    LLM->>ML: Return action items
    ML->>API: ML results
    API->>DB: Save complaint & predictions
    API->>Frontend: Return ticket ID & status
    Frontend->>Customer: Confirmation + Next Steps

    Note over Customer,DB: Entire process completes in <500ms
```
###  Generative Fallback
The Google **Gemini API** is utilized strictly for Natural Language (NL) conversational interactions directly with the customer through the chatbot interface, acting as a friendly conversational layer that wraps the rigid structural outputs of our local ML.

```mermaid
sequenceDiagram
    participant Customer
    participant React App
    participant Flask API
    participant Scikit-Learn
    participant SLA Logic
    participant DB

    Customer->>React App: Submit Issue "App crashing on checkout"
    React App->>Flask API: POST /api/complaints/submit
    Flask API->>Scikit-Learn: Inject Text -> Vectorizer
    Scikit-Learn-->>Flask API: Category: Bug | Priority: High | Fraud: False
    Flask API->>SLA Logic: Calc (Priority: High, Created: Now)
    SLA Logic-->>Flask API: Deadline: 24h, Score: 100
    Flask API->>DB: INSERT Ticket
    DB-->>Flask API: Return Success (Ticket ID)
    Flask API-->>React App: Resolved / Forwarded
    React App-->>Customer: Show Tracking Dashboard
```

---

## 💻 Technology Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router DOM v7
- **Charting:** Recharts
- **UI Components:** Lucide React Icons
- **Notifications:** React Hot Toast
- **Time Utilities:** timeago.js

### Backend
- **Framework:** Flask (Python)
- **Authentication:** JWT (JSON Web Tokens)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **API Style:** RESTful

### Machine Learning
- **Classification:** Scikit-Learn
- **Advanced ML:** XGBoost
- **Text Processing:** NLTK, TF-IDF
- **Sentiment Analysis:** TextBlob / VADER
- **Similarity:** Cosine Similarity

### AI/LLM Services
- **Primary:** Google Generative AI (Gemini)
- **Alternative:** Groq API
- **Use Case:** Dynamic recommendation generation

### DevOps & Tools
- **Version Control:** Git
- **Development:** VSCode, Python 3.9+
- **Package Managers:** pip (Python), npm (JavaScript)

---

## 📁 Project Structure

```
ResolveX/
│
├── 📄 README.md                          # Main project documentation
├── 📄 README_ROOT.md                     # Root folder documentation (this file)
├── 📄 implementation_plan.md             # Detailed implementation roadmap
├── 📄 model_results.json                 # ML model performance metrics
│
├── 🎨 Frontend/                          # React + Vite application
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── pages/                        # Route pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── admin/
│   │   │   ├── dashboards/               # Multi-role dashboards
│   │   │   └── qa-dashboard/             # QA specific pages
│   │   ├── context/                      # React Context (Auth)
│   │   ├── layouts/                      # Layout components
│   │   ├── assets/                       # Images & media
│   │   ├── styles/                       # CSS stylesheets
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.html
│   ├── vite.config.js                    # Vite configuration
│   ├── eslint.config.js                  # Code linting rules
│   └── package.json                      # Dependencies
│
└── 🐍 Backend/                           # Flask Python API
    ├── app.py                            # Flask application entry point
    ├── apitest.py                        # API testing utilities
    ├── migrate_db.py                     # Database migrations
    ├── requirements.txt                  # Python dependencies
    │
    ├── config/                           # Configuration modules
    │   ├── db.py                         # Database configuration
    │   └── settings.py                   # App settings
    │
    ├── data/                             # Dataset directory
    │   ├── TS-PS14.csv                   # Raw dataset (50K records)
    │   └── cleaned_TS-PS14.csv           # Processed dataset
    │
    ├── models/                           # SQLAlchemy models
    │   ├── complaint_model.py
    │   ├── customer_model.py
    │   ├── escalation_model.py
    │   ├── feedback_model.py
    │   ├── history_model.py
    │   └── user_model.py
    │
    ├── ml/                               # Machine Learning pipeline
    │   ├── preprocessing.py              # Text cleaning & feature extraction
    │   ├── train_models.py               # Model training scripts
    │   └── trained_models/               # Serialized model artifacts (.pkl)
    │
    ├── services/                         # Business logic services
    │   ├── classifier_service.py         # Category classification
    │   ├── gemini_service.py             # Google Gemini integration
    │   ├── groq_service.py               # Groq API integration
    │   ├── recurring_issue_service.py    # Issue pattern detection
    │   ├── similarity_service.py         # Duplicate detection
    │   └── sla_calculator.py             # SLA deadline calculation
    │
    └── routes/                           # API endpoints
        ├── admin_routes.py               # Admin operations
        ├── ai_routes.py                  # AI/ML processing endpoints
        ├── auth_routes.py                # Authentication endpoints
        ├── chat_routes.py                # Chat/conversation endpoints
        ├── chatbot_routes.py             # Chatbot endpoints
        ├── complaint_routes.py           # Complaint management
        ├── customerse_api.py             # Customer endpoints
        ├── feedback_routes.py            # Feedback endpoints
        ├── recurring_issue_routes.py     # Issue analysis endpoints
        └── user_routes.py                # User management endpoints
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **Python** 3.9+
- **PostgreSQL** 12+
- **Git**
- API Keys: Google Generative AI, Groq (optional)

### Installation Steps

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/[your-org]/ResolveX.git
cd ResolveX
```

#### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and database credentials

# Initialize database
python migrate_db.py

# Train ML models (if not already trained)
python ml/train_models.py
```

#### 3️⃣ Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd Frontend

# Install Node dependencies
npm install

# Create environment configuration
cp .env
# Edit .env with your API endpoints
```

### Environment Variables

**Backend (.env)**
```
FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/resolvex_db
JWT_SECRET_KEY=your-secret-key-here
GOOGLE_API_KEY=your-google-gemini-key
GROQ_API_KEY=your-groq-api-key
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

---

## ▶️ Running the Application

### Development Mode

#### Terminal 1 - Backend Server
```bash
cd Backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```
Backend runs on: `http://localhost:5000`

#### Terminal 2 - Frontend Server
```bash
cd Frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Production Build

#### Frontend
```bash
cd Frontend
npm run build
# Output: dist/
```

#### Backend
```bash
# Set environment to production
export FLASK_ENV=production
python app.py
```

### Testing the API

```bash
# Run API tests
cd Backend
python apitest.py
```

### Available API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/complaints` | Submit new complaint |
| `POST` | `/api/ai/process_complaint` | Process complaint with ML |
| `GET` | `/api/complaints/<id>` | Retrieve complaint details |
| `GET` | `/api/dashboards/admin` | Admin dashboard data |
| `GET` | `/api/dashboards/manager` | Manager dashboard data |
| `GET` | `/api/dashboards/qa` | QA analytics data |
| `GET` | `/api/sla/status` | Current SLA status |

---

## 📸 Project Gallery

| No. | Module | Screenshot | Description |
|----|--------|------------|-------------|
| 1 | Landing Page | ![](./ss/ss-1.png) | Main homepage of ResolveX platform. |
| 2 | Sign In | ![](./ss/ss-2.png) | Secure email/password login page. |
| 3 | Database | ![](./ss/ss-3.png) | Neon DB with bcrypt password storage. |
| 4 | Customer Dashboard | ![](./ss/ss-4.png) | Active tickets and complaint overview. |
| 5 | Complaint Submit | ![](./ss/ss-5.png) | Complaint inserted with AI suggestion. |
| 6 | Complaint History | ![](./ss/ss-6.png) | Past submitted complaint records. |

| No. | Module | Screenshot | Description |
|----|--------|------------|-------------|
| 7 | Track Status | ![](./ss/ss-7.png) | Real-time complaint progress tracking. |
| 8 | Notifications | ![](./ss/ss-8.png) | Updates and complaint alerts. |
| 9 | Rating Page | ![](./ss/ss-9.png) | Rate final complaint resolution. |
| 10 | Executive Dashboard | ![](./ss/ss-10.png) | Live complaint monitoring panel. |
| 11 | AI Resolution | ![](./ss/ss-11.png) | AI actions and status override page. |
| 12 | Analytics Panel | ![](./ss/ss-12.png) | Category trends and SLA metrics. |

| No. | Module | Screenshot | Description |
|----|--------|------------|-------------|
| 13 | QA Dashboard | ![](./ss/ss-13.png) | Weekly trends and QA insights. |
| 14 | Misclassifications | ![](./ss/ss-14.png) | Correct low-confidence predictions. |
| 15 | Recurring Issues | ![](./ss/ss-15.png) | Detect repeated complaint clusters. |
| 16 | Feedback Analytics | ![](./ss/ss-16.png) | Customer feedback review system. |
| 17 | Operations Dashboard | ![](./ss/ss-17.png) | Operational ticket overview. |
| 18 | AI Audit | ![](./ss/ss-18.png) | AI quality and flagged issue checks. |

| No. | Module | Screenshot | Description |
|----|--------|------------|-------------|
| 19 | Resolution Review | ![](./ss/ss-19.png) | Approve AI resolutions. |
| 20 | Admin Dashboard | ![](./ss/ss-20.png) | System-wide admin controls. |
| 21 | Manage Categories | ![](./ss/ss-21.png) | Edit complaint categories. |
| 22 | Export Reports | ![](./ss/ss-22.png) | Download CSV / JSON reports. |
| 23 | Retrain Models | ![](./ss/ss-23.png) | Trigger ML model retraining. |
| 24 | User Management | ![](./ss/ss-24.png) | Create users and assign roles. |


---
## 📚 Key Features

### 🎯 Intelligent Ticket Classification
- **Real-time categorization** into predefined categories
- **99.8% accuracy** using XGBoost + Scikit-Learn
- **Sub-100ms** processing latency

### 📊 Dynamic Priority Assignment
- Automatic priority prediction (High/Medium/Low)
- Sentiment-aware escalation
- Dynamic SLA deadline calculation

### 🔍 Duplicate & Fraud Detection
- TF-IDF similarity-based duplicate detection
- Spam filtering
- Pattern recognition for fraudulent requests

### 💡 LLM-Powered Recommendations
- Context-aware action suggestions
- Customer-specific resolution steps
- Integration with Google Gemini and Groq

### 📈 Multi-Role Dashboards
- **Customer Portal:** Self-service ticket tracking
- **Manager Dashboard:** Queue monitoring & assignment
- **Executive Console:** High-priority escalations
- **QA Analytics:** Performance & accuracy metrics

### 🔐 Enterprise Security
- JWT-based authentication
- Role-based access control (RBAC)
- PostgreSQL with encrypted credentials
- Audit logging

### 📱 Responsive Design
- Mobile-friendly interfaces
- Cross-browser compatibility
- Real-time updates with WebSocket support (optional)

---


