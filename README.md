# ProofPath: Evidence-Driven Adaptive Interview Intelligence System

> **Google Student Club Hackathon 2026** • Track: *Adaptive Interview Intelligence*  
> **Student Author:** 3rd-Year Computer Science and Engineering  
> **Repository:** `ProofPath`

---

## 1. Product Vision & Central Question

Traditional technical interview platforms ask a static sequence of questions and generate an arbitrary score. They suffer from two major flaws:
1. They act as black boxes without demonstrable evidence citations.
2. They cannot adapt when a candidate reveals an unexpected strength or knowledge gap.

**ProofPath** inverts this model. It actively investigates what a candidate can demonstrate, extracts concrete text and execution evidence, identifies unresolved gaps, and dynamically determines what to assess next.

### The Central Question
$$\text{"Given the evidence collected so far, what should we assess next, and why?"}$$

---

## 2. Core Architectural Components

ProofPath is designed as a modular, explainable full-stack application:

```
ProofPath/
├── backend/
│   ├── src/
│   │   ├── engine/
│   │   │   ├── adaptiveEngine.js   # Deterministic question selection & branching rules
│   │   │   ├── rubricEvaluator.js  # Rubric evaluation & textual excerpt extractor
│   │   │   └── codeRunner.js       # Safe isolated Python execution sandbox
│   │   ├── db/
│   │   │   ├── database.js         # SQLite connection manager (native node:sqlite)
│   │   │   ├── schema.sql          # Persistent relational schema
│   │   │   └── seedData.js         # Pre-configured roles, rubrics & questions
│   │   ├── routes/                 # REST API endpoints
│   │   ├── ai/
│   │   │   └── geminiService.js    # Gemini Live integration with transparent fallback
│   │   └── server.js               # Express application entry point (Port 5000)
│   └── tests/                      # Automated test suite (unit + integration)
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI (StatusBadge, DecisionBanner, EvidenceCard, Navbar)
│   │   ├── pages/                  # 8 required functional pages
│   │   └── api/client.js           # REST API client
│   ├── vite.config.js
│   └── tailwind.config.js
├── scripts/
│   ├── dev.js                      # Concurrent development launcher
│   └── verify_live.js              # Live end-to-end verification script
├── package.json
└── README.md
```

---

## 3. Core Differentiating Features

### A. The Evidence Ledger
Every candidate inquiry generates a permanent evidence record:
* **Competency Evaluated**: The specific technical skill under assessment.
* **Question Administered**: Exact inquiry presented.
* **Candidate Response**: Text answer or Python source code.
* **Observed Evidence Excerpts**: Direct verbatim quotes extracted from the candidate's answer.
* **Criteria Satisfied**: Technical standards proven.
* **Unresolved Gaps**: Expected concepts that were missing.
* **Status**: One of `Demonstrated`, `Partially Demonstrated`, `Insufficient Evidence`, or `Not Yet Assessed`.
* **Adaptive Trigger**: Why the next inquiry was selected.

### B. Adaptive Assessment Engine (Genuine Branching)
The engine runs independently of the LLM using explicit, testable decision rules:
* **Path A (Drill-down)**: Candidate demonstrates partial knowledge on a topic (e.g., designs an LRU cache structure but omits $O(1)$ time complexity analysis). The engine immediately selects a targeted drill-down question investigating algorithmic complexity and pointer mechanics.
* **Path B (Broadening)**: Candidate thoroughly demonstrates all rubric criteria. The engine shifts to the highest-priority under-assessed competency (e.g., Concurrency or Distributed System Architecture) to maximize role coverage.
* **Repeats Guard**: Previously administered questions are never asked again.
* **Session Budget Termination**: Concludes when the question budget is satisfied or all role competencies are demonstrated.

### C. Explainable Rubrics & Ethical Guardrails
* Uses explicit, domain-grounded rubric criteria with keyword and concept associations.
* **No black box judgments**: Evaluates solely technical content. Never infers personality, sentiment, emotion, or cultural background.
* Does not automate hiring or rejection decisions; produces an evidence portfolio to empower human interviewers.

### D. Safe Technical Code Sandbox
* Features an interactive Python coding workspace for algorithmic challenges (e.g., implementing an LRU Cache).
* Runs inside an isolated child process with:
  - Blocked unsafe system modules (`os`, `subprocess`, `socket`, `shutil`, `ctypes`).
  - Strict 3500ms execution timeout against infinite loops.
  - Automated test assertions evaluating correctness, edge cases, and eviction.
  - Telemetry output (execution time, test passes, stdout).

### E. Interactive Competency Map
* Live visualization mapping all competencies for the role.
* Inspecting any competency displays questions asked, verified quotes, satisfied criteria, unresolved gaps, and recommended next inquiries.

### F. Ordered Evidence Timeline
* Chronological audit stream detailing every inquiry, response, rubric evaluation, and adaptive transition.

### G. Evidence-Backed Final Report
* Summary of demonstrable technical capabilities vs unverified claims.
* Competency coverage percentage.
* Suggested technical inquiries for the human interviewer debrief panel.
* One-click "Print / Save PDF" and "Copy Markdown Report".

---

## 4. AI Engine Configuration

ProofPath supports two operating modes:
1. **Live Gemini AI Engine**: If `GEMINI_API_KEY` is provided in the environment or `.env`, the backend uses Google's Gemini API for advanced semantic rubric evaluation and question synthesis.
2. **Deterministic Explainable Demo Mode**: If no API key is present, ProofPath automatically operates in a transparent, deterministic rule-based demo engine.
> The active mode is clearly disclosed in the top navigation bar at all times.

---

## 5. Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons (Pure JavaScript and JSX, ErrorBoundary, Camera preview, Web Speech API dictation).
* **Backend**: Node.js, Express, REST API, bcryptjs password hashing, JWT token authentication, Multer multipart storage, pdf-parse v2 text extraction.
* **Database**: MongoDB with Mongoose schemas (separate test database isolation with `proofpath_test`, automatic SQLite legacy migration).
* **Testing**: Built-in `node:test` runner with 43 automated unit and integration tests across 7 test suites.

---

## 6. Setup & Execution Instructions

### Prerequisites
* Node.js v20+ or v22+
* MongoDB running locally on port 27017 (or `MONGODB_URI` connection string)
* Python 3.10+ (for hands-on Python coding challenge)

### Step 1: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### Step 2: Environment Configuration
Copy `backend/.env.example` to `backend/.env` (optional for local defaults):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/proofpath
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/proofpath_test
JWT_SECRET=your_strong_jwt_secret_here_32_characters_minimum
```

### Step 3: Build Frontend
```bash
npm run build
```

### Step 4: Run the Application
```bash
# Production mode (Backend serves API and built frontend on port 5000):
npm start

# Or Development mode with hot-reloading (Vite on 5173, Express on 5000):
npm run dev
```
Open **[http://localhost:5000](http://localhost:5000)** (or [http://localhost:5173](http://localhost:5173) in dev mode) in your browser!

### Step 5: Run Tests
```bash
npm test
```
All 43 unit and integration tests across 7 test suites will execute against the isolated `proofpath_test` database and report passing results.

---

## 7. REST API Documentation

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health status, MongoDB connection status, and active AI engine mode |
| `POST` | `/api/auth/register` | Public | Register new evaluator account (bcrypt password hashing) |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return JWT Bearer token |
| `GET` | `/api/auth/me` | Bearer | Fetch authenticated user profile |
| `POST` | `/api/resumes/parse` | Bearer | Parse PDF or TXT resume document in-memory (5MB cap) |
| `GET` | `/api/templates` | Public | Pre-configured job role templates and rubrics |
| `GET` | `/api/assessments` | Bearer | List assessments owned by the authenticated user |
| `POST` | `/api/assessments` | Bearer | Create assessment with optional resume, seed competencies & questions |
| `GET` | `/api/assessments/:id` | Bearer | Fetch owned assessment state, current question, and coverage |
| `DELETE` | `/api/assessments/:id` | Bearer | Delete owned assessment and associated records |
| `POST` | `/api/assessments/:id/submit` | Bearer | Submit response, evaluate rubric, trigger adaptive branching |
| `GET` | `/api/assessments/:id/events` | Bearer | Fetch evidence ledger events and quote excerpts |
| `GET` | `/api/assessments/:id/decisions` | Bearer | Fetch adaptive decision history |
| `GET` | `/api/assessments/:id/competencies` | Bearer | Fetch competency details, verified quotes, and gaps |
| `POST` | `/api/assessments/:id/run-code` | Bearer | Safely execute Python code in sandbox against test suite |
| `POST` | `/api/assessments/:id/submit-code` | Bearer | Submit Python solution into evidence ledger |
| `GET` | `/api/assessments/:id/report` | Bearer | Compile and retrieve final evidence report |

---

## 8. Known Limitations & Future Work

1. **Language Scope in Sandbox**: The safe sandbox currently supports Python. Support for SQL (in-memory SQLite) and TypeScript/JavaScript sandboxes can be added with similar isolation harnesses.
2. **Deterministic Mode Breadth**: In demo mode without Gemini API key, questions and rubrics are seeded from the curated question bank. Setting `GEMINI_API_KEY` expands this to fully arbitrary custom job descriptions.
3. **Multi-Interviewer Live Collaboration**: Future iterations could incorporate WebSockets for concurrent interviewer panel scoring during live interviews.
