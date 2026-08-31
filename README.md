# PathFinder AI &mdash; Intelligent Career & Pathway Navigator

PathFinder AI is an autonomous, full-stack career roadmap generator and learning pathway engine. It models skills, goals, and learning velocity into personalized, dynamic milestone graphs powered by Google Gemini 2.5 Flash and vector similarity algorithms.

---

## 🏛 Architecture Overview

PathFinder AI is structured as a decoupled monorepo containing three core microservices and a PostgreSQL database layer:

```
pathfinder/
├── frontend/                     # React 18 + Vite + TypeScript + Tailwind CSS
├── backend/                      # Node.js + Express + TypeScript API Gateway
├── ai-service/                   # Python 3.11 + FastAPI + Uvicorn Intelligence Engine
├── database/                     # Schema DDL & Seed Data (PostgreSQL / Supabase)
├── package.json                  # Root runner & monorepo orchestrator
├── .gitignore                    # Global ignore definitions
└── README.md                     # Comprehensive documentation
```

### Microservices Breakdown

| Service | Technology Stack | Port | Purpose | Health Check |
| :--- | :--- | :--- | :--- | :--- |
| **`frontend`** | Vite 6, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts | `3000` | Interactive UI, pathway visualization, analytics dashboards, and user journey management. | `http://localhost:3000` |
| **`backend`** | Node.js, Express, TypeScript, pg, JWT, Zod | `5000` | Core API gateway, user authentication, profile data, CRUD operations, database ORM/client. | `http://localhost:5000/api/health` |
| **`ai-service`** | Python 3.11, FastAPI, Uvicorn, Sentence Transformers, Gemini API | `8000` | Generative pathway synthesis, skill gap vector analysis, semantic search, and LLM reasoning. | `http://localhost:8000/health` |
| **`database`** | Supabase / PostgreSQL 15+ | `5432` | Relational persistence for users, skills, roadmaps, milestones, and audit trails. | Remote Supabase Instance |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `v18.0.0+`
- **npm**: `v9.0.0+`
- **Python**: `v3.10+` (Python 3.11 recommended)
- **pip**: `v23.0+`

### 1. Install Dependencies

You can install all dependencies across the entire monorepo with one command:

```bash
npm run install:all
```

Or install service-by-service:

```bash
# Root dependencies
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# AI Service
cd ai-service && pip install -r requirements.txt && cd ..
```

---

## ⚙️ Environment Variables

Both `backend/` and `ai-service/` are pre-configured with `.env` files (and `.env.example` templates).

### Key Variables:
- `PORT`: Service port (`5000` for backend, `8000` for ai-service).
- `SUPABASE_DATABASE_URL`: Connection string to PostgreSQL database.
- `JWT_SECRET`: Secret key for signing and verifying authentication tokens.
- `OPENAI_API_KEY`: API key for Gemini / LLM models.
- `OPENAI_BASE_URL`: Endpoint URL for OpenAI-compatible Gemini endpoints (`https://generativelanguage.googleapis.com/v1beta/openai/`).
- `GEMINI_MODEL`: Model identifier (`gemini-2.5-flash`).

---

## 💻 Running the Services

### Option A: Run All Services Concurrently (Recommended)
From the root workspace directory, run:

```bash
npm run dev
```

This concurrently boots up:
- 🌐 Frontend: `http://localhost:3000`
- ⚙️ Backend: `http://localhost:5000`
- 🧠 AI Service: `http://localhost:8000`

---

### Option B: Run Services Individually

#### 1. Frontend
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

#### 2. Backend API
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

#### 3. AI Service
```bash
npm run dev:ai
# or
cd ai-service && uvicorn app.main:app --reload --port 8000
```

---

## 🩺 Health Check Endpoints

- **Backend Health Check**:
  ```bash
  curl http://localhost:5000/api/health
  # Response: {"status":"ok","service":"backend","timestamp":"...","env":"development"}
  ```

- **AI Service Health Check**:
  ```bash
  curl http://localhost:8000/health
  # Response: {"status":"ok","service":"ai-service","timestamp":"...","model_configured":"gemini-2.5-flash"}
  ```

---

## 🗄 Database Initialization

The `database/` directory contains standard SQL scripts:

1. **`schema.sql`**: Creates tables (`users`, `skills`, `user_skills`, `roadmaps`, `milestones`, `activity_logs`), enums, and indexes.
2. **`seed.sql`**: Seeds default skills, a sample user, and a curated "Generative AI & Agentic Systems Mastery" career pathway with milestones.

To execute against your Supabase instance:
- Open your Supabase SQL Editor and run `database/schema.sql` followed by `database/seed.sql`.

---

## 📦 Monorepo Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Concurrently launches Frontend, Backend, and AI Service |
| `npm run dev:frontend` | Launches Vite frontend development server on port 3000 |
| `npm run dev:backend` | Launches Express backend with hot reloading on port 5000 |
| `npm run dev:ai` | Launches FastAPI Uvicorn server with hot reloading on port 8000 |
| `npm run build` | Builds both frontend and backend for production |
| `npm run install:all` | Installs dependencies across root, frontend, backend, and ai-service |

---

## 🛡 License
MIT License &copy; 2026 PathFinder AI.
