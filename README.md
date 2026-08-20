# 💰 Intellora — Smart Personal Finance Dashboard

[![Build Status](https://github.com/Prem-Sagar-TK/Intellora/actions/workflows/ci.yml/badge.svg)](https://github.com/Prem-Sagar-TK/Intellora/actions/workflows/ci.yml)
[![Docker Support](https://img.shields.io/badge/Docker-Supported-blue?logo=docker)](https://github.com/Prem-Sagar-TK/Intellora)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Vite v8](https://img.shields.io/badge/Vite-v8-646CFF?logo=vite)](https://vite.dev)

A secure, full-stack personal finance management dashboard built with React + Node.js + MongoDB + Docker. Designed with a gorgeous, high-fidelity dark-mode interface, robust security controls, and optimized data performance.

---

## 🎨 Visual Preview

*(Drop screenshots or GIFs of the Dashboard, Transactions, and Reports page here)*

---

## 🗂️ Project Structure

```
Intellora/
├── .github/
│   └── workflows/
│       └── ci.yml      # GitHub Actions CI pipeline
├── backend/            # Express REST API
│   ├── src/
│   │   ├── config/     # MongoDB connection setup
│   │   ├── controllers/# Route controllers (Auth, Tx, Budgets, Insights, Subs)
│   │   ├── middleware/ # Auth validation, error handler, rate limiters
│   │   ├── models/     # Mongoose models (compound indexes defined)
│   │   ├── routes/     # Route endpoints
│   │   └── tests/      # Jest + Supertest integration test suite
│   ├── Dockerfile      # Multi-stage production build
│   └── package.json
├── frontend/           # React SPA
│   ├── src/
│   │   ├── context/    # State context (Auth, Theme, Currency)
│   │   ├── layouts/    # Dashboard layout (nav structure)
│   │   ├── pages/      # Code-split dashboard pages
│   │   └── utils/      # Axios wrapper (transparent silent token renewal)
│   ├── Dockerfile      # Multi-stage nginx-served build
│   └── nginx.conf      # SPA routing config
├── docker-compose.yml  # Multi-container orchestration
└── README.md
```

---

## ✨ Features

- **🔐 Robust Token Rotation**: Access tokens expire in 15 minutes, rotated automatically using a secure `httpOnly`, `Secure`, `SameSite=Strict` cookie containing a 7-day refresh token.
- **📊 Interactive Financial Dashboard**: Track balance, monthly trends, and spending categories using custom Chart.js charts.
- **💳 Transactions & Budgets**: Categorize transactions, set monthly category spending caps, and receive alert badges.
- **🛡️ CSV Import/Export**: Export data or import files safely. Contains automatic magic-byte filtering, size limits, and sanitizes against CSV formula injection.
- **💡 Rule-Based Heuristics & Score**: Evaluates financial habits to calculate a health score (0–100) and displays actionable optimization guides.
- **⚡ Code-Splitting**: React.lazy + Suspense divides routes into chunks, reducing loading latency.

---

## 🔒 Security Hardening

- **httpOnly Refresh Cookies**: Eliminates XSS token theft vectors. Access tokens are kept in memory/scoped state.
- **Rate Limiting**: `express-rate-limit` controls traffic globally (100 req/15 min) and restricts authentication endpoints strictly (15 attempts/15 min) to prevent brute-force attacks.
- **Input Sanitization**: Request bodies are validated against strict type/range boundaries with `Zod` before database query execution, preventing NoSQL injection.
- **File Filter Guard**: Multer is restricted to `.csv` mime-types, limited to a `1MB` upload payload size, and processed without saving executable binaries to disk.
- **CORS Allowed Origins**: Strict CORS configurations prevent arbitrary cross-domain request sharing.
- **Fail-Safe Startup checks**: In `production`, the server fails loudly and exits immediately if critical environment parameters like `JWT_SECRET` are missing or set to vulnerable placeholders.

---

## ⚡ Database Performance

Mongoose schemas are optimized with compound indexes to ensure fast responses even with large tables:
- **Transaction**: Compound index on `{ user: 1, date: -1 }` (recent transactions sorting) and `{ user: 1, category: 1 }` (insights aggregation).
- **Budget**: Unique compound index on `{ user: 1, category: 1, month: 1, year: 1 }` to enforce budget uniqueness constraints.

---

## 🛠️ API Documentation

### Authentication (`/api/auth`)

#### `POST /api/auth/register`
Creates a new account and sets a 7-day refresh token inside an HTTP-only cookie.
* **Request JSON:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "strongPassword123"
  }
  ```
* **Response JSON (201 Created):**
  ```json
  {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### `POST /api/auth/login`
Authenticates a user and issues access/refresh tokens.
* **Request JSON:**
  ```json
  {
    "email": "jane@example.com",
    "password": "strongPassword123"
  }
  ```

#### `POST /api/auth/refresh`
Rotates the access token using the HTTP-only cookie.
* **Response JSON (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### Transactions (`/api/transactions`)

#### `GET /api/transactions`
Fetches a paginated slice of user transactions. Supports `page` and `limit` query parameters.
* **Query Parameters:** `/api/transactions?page=1&limit=2`
* **Response JSON (200 OK):**
  ```json
  {
    "data": [
      {
        "_id": "60d0fe4f5311236168a109cb",
        "user": "60d0fe4f5311236168a109ca",
        "amount": 42.50,
        "type": "expense",
        "category": "Food",
        "description": "Lunch meeting",
        "date": "2026-08-18T00:00:00.000Z",
        "isRecurring": false,
        "createdAt": "2026-08-18T14:43:14.000Z"
      }
    ],
    "total": 12,
    "page": 1,
    "pages": 6
  }
  ```

---

## 🚀 Getting Started

### Local Setup (No Containers)

#### 1. Configure the Environment
Create a `.env` file in the `backend/` directory following the blueprint in `backend/.env.example`.

#### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```

#### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** to view the app.

---

### Containerized Setup (Docker Compose)

Launch the full database-backed architecture locally using single-command container orchestration:

```bash
# Build and run MongoDB, Backend, and Frontend services
docker compose up --build
```
- **Frontend SPA**: http://localhost:8080
- **Backend API**: http://localhost:5000/api
- **Database (MongoDB)**: mongodb://localhost:27017

---

## 🧪 Testing

The backend includes a comprehensive integration test suite running on an in-memory MongoDB server:

```bash
cd backend
npm install
npm test
```

---

## 🚦 Known Limitations & Roadmap

- [ ] **Real ML Modeling**: Current insights are calculated using rule-based heuristics. Future releases will integrate regression modeling to predict next-month budgets.
- [ ] **Plaid Integration**: Sandbox transaction seeding only; future plans include integrating Plaid APIs to sync real bank accounts.
- [ ] **Multi-Currency Conversion**: Local conversion values are simulated; real-time FX API hooks will be added.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
