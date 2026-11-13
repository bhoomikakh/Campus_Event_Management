# Campus Event Management System (MERN)

A role-based web app where **coordinators** create and manage college events and **students** browse and register for them.
Built with MongoDB, Express, React (Vite) and Node.js.

## What's new (security + features)

**Authentication & security**
- Sign up / login for two roles: **Student** and **Coordinator**
- Passwords are hashed with **scrypt + random salt** (never stored as plain text)
- Login returns a signed **JWT** (HS256, 2-hour expiry); every API call except login/signup requires it
- **Role-based authorization** on the server: students cannot add/edit/delete events, coordinators cannot register as students
- Coordinator sign-up is protected by a secret **access code** (`COORDINATOR_CODE` in `.env`)
- A coordinator can only edit/delete **their own** events
- Login **rate limiting** (5 wrong attempts per email/IP -> locked for 15 minutes)
- Input whitelisting (no mass-assignment), JSON body size limit, auto-logout when the token expires

**Features**
- Student: search + category filter, register / cancel registration, seat availability, "My Registrations" tab
- Event capacity (0 = unlimited), "Event Full" and "Completed" handling, no duplicate registrations
- Coordinator: dashboard statistics, see which students registered, mark attendance, download the list as CSV
- Deleting an event also removes its registrations

## How to run

1. **Backend**
   ```
   cd backend
   npm install
   npm run dev        (or: npm start)
   ```
   `backend/.env` must contain (see `.env.example`):
   ```
   MONGODB_URI=...
   PORT=5000
   JWT_SECRET=any_long_random_string
   COORDINATOR_CODE=choose_your_own_secret_code
   ```
2. **Frontend** (new terminal)
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Open the URL Vite prints (usually http://localhost:5173).

No new npm packages were added; the auth uses Node's built-in `crypto` module.

## Try it
1. Sign up as **Coordinator** with the access code set in `COORDINATOR_CODE`, and add an event.
2. Log out, sign up as a **Student**, register for the event.
3. Log back in as the coordinator -> *View Registrations* -> tick attendance / download CSV.

## API

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create account |
| POST | `/api/auth/login` | public | Login, returns JWT |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/events` | logged in | List events with seat counts |
| POST / PUT / DELETE | `/api/events[/:id]` | coordinator (owner) | Manage events |
| POST / DELETE | `/api/events/:id/register` | student | Register / cancel |
| GET | `/api/events/my/registrations` | student | My registrations |
| GET | `/api/events/:id/registrations` | coordinator (owner) | Registered students |
| PATCH | `/api/events/:id/registrations/:regId/attendance` | coordinator (owner) | Mark attendance |
| GET | `/api/events/stats/summary` | coordinator | Dashboard numbers |

## Project structure
```
backend/
  models/       User.js, Event.js, Registration.js
  middleware/   auth.js (protect + role check), rateLimit.js
  routes/       authRoutes.js, eventRoutes.js
  utils/        auth.js (password hashing + JWT)
frontend/src/
  api.js, AuthContext.jsx
  pages/        AuthPage, StudentDashboard, CoordinatorDashboard
  components/   Navbar, EventFilters
```

## Deployment

**Backend (Render, Node web service)** - Root Directory `backend`, Build `npm install`, Start `npm start`.
Environment variables: `MONGODB_URI`, `JWT_SECRET`, `COORDINATOR_CODE`, `CORS_ORIGIN` (frontend URL, no trailing slash).
MongoDB Atlas -> Network Access must allow `0.0.0.0/0`.

**Frontend (Vercel)** - Root Directory `frontend`, Framework Vite (build `npm run build`, output `dist`).
Environment variable: `VITE_API_URL` = `https://<backend-url>/api` (redeploy after changing it).

**Live URL:** _add your Vercel URL here_
