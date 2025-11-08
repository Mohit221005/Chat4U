# Talksy Website Documentation (Frontend + Backend)

## 1) Overview
- **Project Type**: Full-stack web chat application
- **Frontend**: React + Vite + TailwindCSS + Zustand + React Router
- **Backend**: Node.js (Express) + MongoDB + Socket.IO + JWT auth
- **Monorepo Layout**: Backend can serve the built frontend in production

## 2) Repository Structure
```
Talksy/
├─ frontend/              # React (Vite) app
│  ├─ src/
│  │  ├─ pages/           # LoginPage, SignUpPage, ChatPage
│  │  ├─ components/      # Reusable UI components
│  │  ├─ hooks/           # Custom hooks
│  │  ├─ store/           # Zustand state
│  │  ├─ lib/             # API helpers/clients
│  │  ├─ main.jsx         # App bootstrapping
│  │  └─ App.jsx          # Router + layout
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ package.json
│
└─ backend/               # Express API + Socket.IO
   ├─ src/
   │  ├─ server.js        # App entrypoint (serves frontend in prod)
   │  ├─ routes/          # auth.route.js, message.route.js
   │  ├─ controllers/     # auth, message controllers
   │  ├─ middleware/      # auth.middleware.js, arcjet.middleware.js
   │  ├─ models/          # Mongoose models (User, Message, ...)
   │  ├─ lib/             # db.js, env.js, socket.js, utils.js
   │  └─ emails/          # Templates & email helpers
   ├─ .env                # Environment variables
   └─ package.json
```

## 3) Tech Stack
- **Frontend**
  - React 19, React Router 7, Zustand
  - TailwindCSS + DaisyUI
  - Vite 7
  - Axios for HTTP, Socket.IO client for realtime
- **Backend**
  - Express 4, Socket.IO 4
  - Mongoose 8 (MongoDB)
  - JWT (jsonwebtoken), bcryptjs
  - CORS, cookie-parser, dotenv
  - Cloudinary (media), Resend (emails) [if configured]
  - Arcjet middleware (request protection)

## 4) Frontend Details
- **package.json (scripts)**
  - `dev`: start Vite dev server
  - `build`: Vite build to `frontend/dist`
  - `preview`: preview built app
- **Routing**
  - `src/App.jsx`: defines routes and layout
  - Pages: `LoginPage.jsx`, `SignUpPage.jsx`, `ChatPage.jsx`
- **State Management**
  - `src/store/`: Zustand stores for auth/session and chat state
- **Styling**
  - TailwindCSS configured via `tailwind.config.js` and `index.css`
- **API**
  - Typical pattern: a `lib` helper for Axios instance (baseURL), used by pages/components
- **Realtime**
  - `socket.io-client` to connect to backend Socket.IO namespace

## 5) Backend Details
- **server.js**
  - Loads Express with JSON, cookie-parser, CORS
  - CORS origin: `ENV.CLIENT_URL`
  - Mounts routes:
    - `/api/auth` → `auth.route.js`
    - `/api/messages` → `message.route.js`
  - Production mode: serves frontend build from `../frontend/dist`
  - Starts HTTP + Socket.IO server, connects MongoDB
- **auth.route.js**
  - `POST /signup` → create account
  - `POST /login` → authenticate user (returns `{ success, message, token, user }`)
  - `POST /logout` → invalidate session
  - `PUT /update-profile` (protected)
  - `GET /check` (protected) → returns current user
- **message.route.js**
  - `GET /:conversationId` → fetch chat messages
  - `POST /send/:recipientId` → send a message
- **middleware/**
  - `auth.middleware.js` → verifies JWT from Authorization header
  - `arcjet.middleware.js` → request protection via Arcjet
- **lib/**
  - `db.js` → connects to MongoDB
  - `env.js` → loads and validates environment variables
  - `socket.js` → initializes Socket.IO and exports `app` and `server`
  - `utils.js` → `generateToken()` creates and returns JWT for API responses

## 6) How to Run Locally
### Backend
```bash
cd backend
npm install
cp .env.example .env   # if example exists; otherwise create .env with MONGO_URI, JWT_SECRET, CLIENT_URL, PORT
npm run dev            # starts on PORT (default 3000)
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # starts Vite dev server (default http://localhost:5173)
```

### Connect Frontend → Backend (dev)
- Set frontend Axios baseURL to your backend dev URL (e.g., http://localhost:3000/api)
- Ensure CORS `ENV.CLIENT_URL` includes your frontend origin

## 7) Build & Deploy
### Production Build (Frontend)
```bash
cd frontend
npm run build          # outputs to frontend/dist
```

### Serve via Backend (Production)
- Place frontend and backend as in this monorepo layout (already done)
- Backend `server.js` serves `../frontend/dist` when `ENV.NODE_ENV === "production"`
- Deploy backend (Node.js runtime). On start:
  - Connects MongoDB
  - Serves API at `/api/*`
  - Serves frontend at `/` (from `dist`)

## 8) Environment Variables (Backend)
- `PORT` (default 3000)
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL` (frontend origin, comma-separated if multiple)
- Optional: `CLOUDINARY_*`, `RESEND_API_KEY`, Arcjet keys

## 9) Key Concepts for Explanation
- Single repository contains both frontend and backend
- In production, Express serves the built React app, and also exposes `/api` routes and Socket.IO
- Authentication uses JWT; responses include `{ success, message, token, user }` for easy client parsing
- Realtime chat uses Socket.IO with auth

## 10) Quick Demo Steps
1. Run backend: `npm run dev` in `backend/`
2. Run frontend: `npm run dev` in `frontend/`
3. Open frontend dev URL → sign up → login → start chatting

---
This document summarizes structure, key files, how to run locally, and how to deploy. If you want a deeper file-by-file breakdown (with code snippets), say "generate code-embedded website docs".
