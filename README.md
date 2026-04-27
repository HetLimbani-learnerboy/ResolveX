<div align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Hackathon-TechVision%202024-blue?style=for-the-badge&logo=github" alt="Hackathon" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  
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
- **Category:** AI/ML, Customer Service, Enterprise Solutions

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

```mermaid
graph TD
    subgraph Client["🖥️ Frontend Layer - React/Vite"]
        CP["🛒 Customer Portal"]
        MD["📊 Manager Dashboard"]
        EC["👔 Executive Console"]
        QA["🔍 QA Analytics Board"]
    end

    subgraph Auth["🔐 Authentication Layer"]
        JWT["JWT Token Service"]
    end

    subgraph API["🔌 API Gateway - Flask"]
        Router["Request Router"]
        Auth["Auth Service"]
    end

    subgraph Services["⚙️ Core Services"]
        Complaint["Complaint Service"]
        SLA["SLA Calculator"]
        Feedback["Feedback Manager"]
        Recurring["Recurring Issue Detector"]
    end

    subgraph MLPipeline["🤖 AI/ML Intelligence Engine"]
        Preprocessing["Text Preprocessing"]
        Classification["Category Classifier<br/>Scikit-Learn"]
        PriorityPred["Priority Predictor<br/>XGBoost"]
        Fraud["Fraud Detector<br/>Similarity Engine"]
        Recommender["LLM Recommender<br/>Google Gemini"]
    end

    subgraph Database["🗄️ Data Layer"]
        PostgreSQL["PostgreSQL Database"]
        Cache["Cache Layer"]
    end

    subgraph External["🌐 External Services"]
        Gemini["Google Gemini API"]
        Groq["Groq API"]
    end

    CP -->|REST + JWT| JWT
    MD -->|REST + JWT| JWT
    EC -->|REST + JWT| JWT
    QA -->|REST + JWT| JWT

    JWT --> Auth
    Auth --> Router

    Router --> Complaint
    Router --> Feedback
    Router --> Recurring

    Complaint --> SLA
    Complaint --> Preprocessing

    Preprocessing --> Classification
    Preprocessing --> PriorityPred
    Preprocessing --> Fraud

    Classification -->|Category| Recommender
    PriorityPred -->|Priority| Recommender
    Fraud -->|Flagged Duplicates| SLA

    Recommender --> Gemini
    Recommender --> Groq

    SLA --> PostgreSQL
    Classification --> Cache
    PriorityPred --> Cache
    Feedback --> PostgreSQL

    style Client fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Auth fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style API fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style Services fill:#374151,stroke:#6366f1,stroke-width:2px,color:#fff
    style MLPipeline fill:#312e81,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style Database fill:#064e3b,stroke:#f59e0b,stroke-width:2px,color:#fff
    style External fill:#7c2d12,stroke:#ec4899,stroke-width:2px,color:#fff
```

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

### Request Processing Pipeline

```mermaid
graph LR
    subgraph Step1["Step 1: Intake"]
        A["📝 Customer Submits Complaint"]
    end

    subgraph Step2["Step 2: Validation"]
        B["🔐 JWT Authentication"]
        C["✅ Input Validation"]
    end

    subgraph Step3["Step 3: Preprocessing"]
        D["🧹 Text Cleaning"]
        E["🎯 Sentiment Analysis"]
    end

    subgraph Step4["Step 4: Intelligence"]
        F["🏷️ Category Classification"]
        G["📊 Priority Prediction"]
        H["🔍 Fraud Detection"]
    end

    subgraph Step5["Step 5: Recommendations"]
        I["💡 LLM Analysis<br/>Generate Action Items"]
    end

    subgraph Step6["Step 6: Assignment"]
        J["⏱️ SLA Calculator<br/>Set Deadline"]
        K["👤 Route to Support Team"]
    end

    subgraph Step7["Step 7: Tracking"]
        L["📊 Dashboard Updates"]
        M["📈 Analytics Processed"]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    F --> I
    G --> I
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M

    style Step1 fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style Step2 fill:#10b981,stroke:#065f46,stroke-width:2px,color:#fff
    style Step3 fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff
    style Step4 fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    style Step5 fill:#ec4899,stroke:#831843,stroke-width:2px,color:#fff
    style Step6 fill:#06b6d4,stroke:#164e63,stroke-width:2px,color:#fff
    style Step7 fill:#14b8a6,stroke:#134e4a,stroke-width:2px,color:#fff
```

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

### Add Your Project Screenshots Here

Below are placeholder sections for your project images. Replace the URLs with actual screenshots from your implementation:

#### 1. Landing Page
```
![Landing Page](./screenshots/landing-page.png)
```

#### 2. Customer Portal
```
![Customer Portal](./screenshots/customer-portal.png)
```

#### 3. Manager Dashboard
```
![Manager Dashboard](./screenshots/manager-dashboard.png)
```

#### 4. Executive Console
```
![Executive Console](./screenshots/executive-console.png)
```

#### 5. QA Analytics Board
```
![QA Analytics](./screenshots/qa-analytics.png)
```

#### 6. ML Classification Results
```
![ML Results](./screenshots/ml-results.png)
```

#### 7. Real-Time Monitoring
```
![Monitoring](./screenshots/monitoring.png)
```

#### 8. SLA Tracking Interface
```
![SLA Tracking](./screenshots/sla-tracking.png)
```

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


