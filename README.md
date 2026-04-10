# ⚡ TaskFlow — Real-Time Collaborative Task Manager

> **Full-stack portfolio project** showcasing React, Node.js, Socket.io, JWT Auth, and Stripe Subscriptions.

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Socket.io-client |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), bcrypt |
| Payments | Stripe Subscriptions (Free / Pro tiers) |
| Real-time | Socket.io rooms per workspace |

---

## ✨ Features

- 🔐 **JWT Authentication** — register, login, refresh tokens, protected routes
- 💳 **Stripe Subscriptions** — Free tier (3 boards) vs Pro tier (unlimited)
- 📡 **Real-Time Collaboration** — live task updates via Socket.io rooms
- 🗂️ **Kanban Boards** — drag-and-drop columns: To Do / In Progress / Done
- 👥 **Workspaces** — invite team members by email
- 🔔 **Live Notifications** — toast alerts when teammates move tasks
- 🧪 **Clean Architecture** — controllers, middleware, models all separated

---

## 📁 Project Structure

```
taskflow/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── context/         # Auth & Socket context
│   │   └── hooks/           # Custom React hooks
│   └── package.json
│
├── server/                  # Node.js + Express backend
│   ├── routes/              # auth, boards, tasks, payments
│   ├── middleware/          # JWT auth guard
│   ├── models/              # Mongoose schemas
│   ├── config/              # DB + Stripe config
│   └── index.js             # Entry point with Socket.io
│
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (test keys)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/taskflow.git
cd taskflow

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Environment Variables

**server/.env**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
CLIENT_URL=http://localhost:5173
```

**client/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Run the App

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

App runs at `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Boards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards` | List user's boards |
| POST | `/api/boards` | Create board |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards/:id/tasks` | Get tasks for board |
| POST | `/api/boards/:id/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task (triggers socket event) |
| DELETE | `/api/tasks/:id` | Delete task |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create-checkout` | Create Stripe session |
| POST | `/api/payments/webhook` | Stripe webhook handler |
| GET | `/api/payments/subscription` | Get user subscription |
| POST | `/api/payments/cancel` | Cancel subscription |

---

## 🔄 Real-Time Events (Socket.io)

| Event | Direction | Payload |
|---|---|---|
| `join-board` | Client → Server | `{ boardId }` |
| `task-updated` | Server → Client | `{ task }` |
| `task-created` | Server → Client | `{ task }` |
| `task-deleted` | Server → Client | `{ taskId }` |
| `user-joined` | Server → Client | `{ userName }` |

---

## 💳 Stripe Integration

- **Free Plan**: Up to 3 boards, solo only
- **Pro Plan ($9/mo)**: Unlimited boards, team collaboration, file attachments

Uses Stripe Checkout for payment flow and webhooks to sync subscription status to the database.

---

## 🧠 Key Technical Decisions

1. **Refresh Token Rotation** — Access tokens expire in 15m; refresh tokens in 7d, stored in httpOnly cookies
2. **Socket Rooms** — Each board has its own Socket.io room; users join/leave on board navigation
3. **Stripe Webhooks** — Subscription status is source-of-truth; never trust client for plan checks
4. **Middleware-First Auth** — All protected routes pass through `authMiddleware` before hitting controllers

---

## 📸 Screenshots

> Add screenshots of your running app here for maximum recruiter impact!

---

## 🎯 What This Demonstrates

- ✅ Full-stack architecture with clean separation of concerns
- ✅ Real-time communication with Socket.io
- ✅ Secure authentication with JWT + refresh token rotation
- ✅ Payment integration with Stripe webhooks
- ✅ MongoDB schema design with Mongoose
- ✅ React state management with Context API
- ✅ Custom hooks for reusable logic
- ✅ Environment-based configuration
