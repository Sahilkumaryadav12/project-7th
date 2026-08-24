# MediTrack — Full-Stack Medication Compliance Tracker

MediTrack is a production-grade full-stack web application designed for tracking medication adherence, materializing daily schedules, providing in-app/browser reminders, offering caregiver supervision, and generating downloadable PDF compliance reports.

---

## 🌟 Key Features

1. **Patient Portal**:
   - Full CRUD management of active medications, dosages, frequencies, food instructions, and custom timings.
   - Live Dashboard metrics (Weekly Compliance, Taken Today, Missed Today, Upcoming Doses).
   - Medical Safety Disclaimer banner displayed on Dashboard and Medication details.
   - Missed Dose Alert banner with direct link to medication details.
   - Interactive Today Schedule with one-click actions: **Taken**, **Snooze (15m/30m)**, or **Missed**.
   - Filterable Medication Log History by date, status, or medication.
   - Upload & Manage Doctor Prescriptions (PDF, JPG, PNG validation).
   - Executive Compliance Analytics with **Downloadable PDF Compliance Report**.

2. **Caregiver Supervision Portal**:
   - Read-only monitoring for caregivers assigned via accepted relationships.
   - Live adherence rates, medication list, and historical dose logs for assigned patients.
   - Caregivers cannot create, edit, or delete patient medications or logs (enforced server-side).
   - Invitation system allowing caregivers to request access via patient email.

3. **Real-time Reminders & Notifications**:
   - Native Browser Notification API integration.
   - Client-side 30s interval checking for due/snoozed doses.
   - In-app **ReminderCard** modal with Taken / Snooze / Dismiss options.

4. **Security & Data Integrity**:
   - Single source of truth backend compliance algorithm: `(taken / (taken + missed)) * 100`.
   - Unique compound index `(userId, medicineId, scheduledDate, scheduledTime)` preventing duplicate log materialization.
   - Passwords hashed with `bcryptjs` (cost factor 10).
   - JWT authentication (`Bearer <token>`) with role-based routing.
   - Centralized Express error handler returning sanitized `{ error: message }` responses.

---

## 🛠️ Tech Stack

| Layer | Tech Stack |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript (ES6+), React Router DOM v6 |
| **Styling** | Modern Plain CSS (CSS Custom Properties, Glassmorphism, Responsive Mobile Bottom Nav) |
| **Charts** | Recharts (LineChart & BarChart) |
| **Icons** | Lucide React |
| **PDF Export** | jsPDF + jsPDF-AutoTable |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose (with MongoDB Memory Server fallback) |
| **Auth** | JWT + bcryptjs |
| **Uploads** | Multer (Saved to `server/uploads/`, served statically) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Environment Variables (.env)

The server utilizes `server/.env`. A default `.env` file is pre-configured:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/meditrack
JWT_SECRET=meditrack_super_secret_jwt_key_2026_secure
CLIENT_URL=http://localhost:5173
```

> **Note**: If a local MongoDB instance is not running on port 27017, the server will automatically spin up an embedded `mongodb-memory-server` fallback, requiring **zero extra setup** to run!

### 3. Seed Demo Data

Populate the database with demo users, 4 realistic medicines, 14 days of compliance log history, and a sample prescription:

```bash
cd server
npm run seed
```

### 4. Run Application

Start both backend and frontend servers:

```bash
# Start Backend API (Port 5000)
cd server
npm run dev

# In a second terminal window, start Frontend (Port 5173)
cd client
npm run dev
```

Access the application in your browser at: **`http://localhost:5173`**

---

## 🔑 Demo Credentials

| Role | Email | Password | Features Access |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@meditrack.com` | `Password123!` | Full CRUD on Medicines, Logs, Prescriptions, Analytics, PDF Export |
| **Caregiver** | `caregiver@meditrack.com` | `Password123!` | Read-Only supervision on assigned patient Sarah Connor |

---

## 📡 REST API Documentation

### Auth Endpoints
- `POST /api/auth/register` - Create patient or caregiver account.
- `POST /api/auth/login` - Authenticate & obtain JWT token.
- `GET /api/auth/me` - Fetch authenticated user profile.
- `POST /api/auth/logout` - Logout session.

### Medicine Endpoints (Patient Owned)
- `GET /api/medicines` - List caller's medicines with per-medicine compliance %.
- `POST /api/medicines` - Add new medication.
- `GET /api/medicines/:id` - Single medicine details + log history.
- `PUT /api/medicines/:id` - Update medication parameters.
- `DELETE /api/medicines/:id` - Delete medication & cascade logs.

### Medication Log Endpoints
- `GET /api/medication-logs?date=&medicineId=&status=` - Filtered log retrieval.
- `POST /api/medication-logs` - Materialize or upsert a dose log.
- `PUT /api/medication-logs/:id` - Update status (`taken`, `missed`, `snoozed`).

### Dashboard & Analytics Endpoints
- `GET /api/dashboard` - Today's schedule, metrics (`takenToday`, `missedToday`, `upcoming`), weekly compliance rate.
- `GET /api/reports/weekly` - 7-day rolling adherence trend for Recharts line chart.
- `GET /api/reports/monthly` - 30-day overall compliance, monthly shift %, per-medicine breakdown.

### Prescription Endpoints
- `GET /api/prescriptions` - List user prescriptions.
- `POST /api/prescriptions` - Upload prescription (multipart file, doctorName, date, notes).
- `DELETE /api/prescriptions/:id` - Delete prescription & remove upload file.

### Caregiver Supervision Endpoints
- `GET /api/caregiver/patients` - List assigned patients + summary stats.
- `GET /api/caregiver/patients/:patientId` - Read-only detailed patient schedule & history.
- `POST /api/caregiver/invite` - Send supervision invite by patient email.
- `PUT /api/caregiver/relationships/:id` - Accept/Revoke relationship status.

---

## ⚕️ Medical Safety Constraint Notice

> "MediTrack is a medication management and reminder tool. It does not replace professional medical advice. Always follow your healthcare professional's prescription."
