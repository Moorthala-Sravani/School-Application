# School Management App

## Overview
A React Native mobile app ("MyApplication") with a Node.js/Express REST API backend. The mobile app connects to the backend API for all data operations.

## Architecture

### Mobile App (React Native)
- **Entry**: `index.js` → `src/App.tsx`
- **Navigation**: React Navigation (stack, drawer, bottom tabs)
- **State**: Redux Toolkit + redux-persist
- **API**: Axios-based client in `src/api/`
- **Screens**: Admin, Teacher, Parent roles in `src/screens/`

### Backend (Express API)
- **Entry**: `Backend/src/app.js`
- **Port**: 5000
- **Database**: PostgreSQL (Replit managed, via `pg` package)
- **Auth**: JWT (`jsonwebtoken`), passwords hashed with `bcrypt`

## Key Files
- `Backend/src/app.js` — Express app, route mounting, server startup
- `Backend/src/config/db.js` — PostgreSQL pool with mysql2-compatible adapter
- `Backend/src/controllers/` — Business logic for all features
- `Backend/src/routes/` — Route definitions
- `Backend/src/middlewares/authMiddleware.js` — JWT verification
- `src/api/axiosInstance.ts` — Mobile app HTTP client

## Database
- **Type**: PostgreSQL (Replit built-in)
- **Connection**: Via `DATABASE_URL` environment variable
- **Adapter**: `Backend/src/config/db.js` provides a mysql2-compatible wrapper around `pg`
  - Converts `?` placeholders to `$1, $2, ...`
  - Handles bulk `VALUES ?` inserts
  - Handles `IN (?)` with array params
  - Adds `RETURNING id` to INSERT statements automatically

## Tables
- `admins`, `teachers`, `parents` — User accounts by role
- `attendance` — Leave requests and attendance records
- `homework` — Homework assigned by teachers
- `messages` — In-app messaging between roles
- `fees` — Student fee records
- `events` — School calendar events
- `bus_routes`, `bus_stops` — School bus info
- `payments` — Fee payment records
- `teacher_salary` — Teacher salary slips
- `teacher_timetable` — Teacher weekly schedule
- `uniform_measurements` — Uniform order requests
- `report_cards`, `subject_grades` — Academic reports

## API Endpoints
- `POST /api/auth/register` — Register (Parent/Teacher/Admin)
- `POST /api/auth/login` — Login (returns JWT)
- `POST /api/auth/reset-password` — Reset password
- `GET /api/profile/parent|teacher|admin` — Get profile
- `GET/POST /api/homework` — Homework
- `GET/POST /api/messages` — Messages
- `GET /api/fees` — Fees
- `GET/POST /api/attendance` — Attendance & leaves
- `GET /api/events` — Calendar events
- `GET /api/buses` — Bus routes
- `GET/POST /api/reports` — Report cards
- `GET/POST /api/billing/fees|bus` — Generate bills
- `GET/POST /api/payments` — Payment processing
- `GET/PUT /api/uniform` — Uniform measurements
- `GET /api/salary` — Teacher salary
- `GET /api/timetable` — Teacher timetable
- `GET/POST /api/notifications` — Notifications

## Running
- **Backend**: `node Backend/src/app.js` (port 5000)
- **Mobile**: Requires Android/iOS simulator — cannot run in Replit preview
