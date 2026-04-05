# MedGen-v2

AI-powered medical-legal report generation system. Doctors record or upload consultation audio; the backend transcribes it (ElevenLabs Scribe V2), fills a DOCX template using Claude AI, and delivers a finished report to the mobile app in real time.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Supabase Setup](#supabase-setup)
6. [Redis Setup](#redis-setup)
7. [Backend Setup & Run](#backend-setup--run)
8. [Database Migrations](#database-migrations)
9. [ARQ Worker Setup & Run](#arq-worker-setup--run)
10. [Mobile App Setup & Run](#mobile-app-setup--run)
11. [Local Development with ngrok](#local-development-with-ngrok)
12. [Running Everything Together](#running-everything-together)
13. [API Reference](#api-reference)
14. [Real-time Events](#real-time-events)
15. [Pipeline Flow](#pipeline-flow)

---

## Architecture Overview

```
Mobile App (Expo React Native)
      │  REST API + WebSocket
      ▼
FastAPI Backend  ─────►  ARQ Worker (Redis queue)
      │                        │
      ▼                        ▼
 Supabase DB            ElevenLabs STT
 Supabase Storage       Claude Opus AI
 Supabase Auth          docxtpl DOCX render
```

- **Backend** — FastAPI (Python), async SQLAlchemy + asyncpg, Supabase Postgres
- **Worker** — ARQ (async Redis queue), runs the transcribe → fill → generate pipeline
- **Mobile** — Expo React Native (iOS/Android), Expo Router, Zustand, React Query
- **Auth** — Supabase Auth (JWKS JWT verification, RS256/ES256)
- **Storage** — Supabase Storage (audio, reports, templates buckets)
- **Real-time** — WebSocket (`/ws/notifications`) + SSE (`/jobs/{id}/stream`)

---

## Prerequisites

### System requirements

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Included with Node |
| Redis | 7+ | `brew install redis` (macOS) |
| ngrok | Any | `brew install ngrok` |

### Accounts & API keys needed

| Service | Purpose | Sign up |
|---------|---------|---------|
| [Supabase](https://supabase.com) | Database, Auth, Storage | Free tier available |
| [Anthropic](https://console.anthropic.com) | Claude AI for report generation | Pay-per-use |
| [ElevenLabs](https://elevenlabs.io) | Scribe V2 speech-to-text | Pay-per-use |
| [OpenAI](https://platform.openai.com) | Optional AI fallback | Pay-per-use |
| [Deepgram](https://deepgram.com) | Optional STT fallback | Free tier available |

---

## Project Structure

```
MedGen-v2/
├── .env                        # Your actual env vars (never commit)
├── .env.sample                 # Template — copy to .env and fill in
├── alembic.ini                 # Alembic config
├── alembic/
│   └── env.py                  # Migration environment
├── backend/
│   ├── main.py                 # FastAPI app, all routers registered
│   ├── config.py               # Pydantic settings (reads .env)
│   ├── database.py             # SQLAlchemy engine + session + Supabase client
│   ├── auth.py                 # JWT verification, RBAC dependencies
│   ├── worker.py               # ARQ worker settings
│   ├── models/                 # SQLAlchemy ORM models (13 tables)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── routers/                # FastAPI route handlers
│   │   ├── patients.py
│   │   ├── appointments.py
│   │   ├── recordings.py       # Upload + enqueue pipeline
│   │   ├── reports.py          # View, edit, approve, download
│   │   ├── notifications.py
│   │   ├── templates.py
│   │   ├── me.py               # Profile endpoints
│   │   ├── ws.py               # WebSocket /ws/notifications
│   │   └── stream.py           # SSE /jobs/{id}/stream
│   ├── services/
│   │   ├── storage.py          # Supabase Storage (upload/download/signed URL)
│   │   ├── transcription.py    # ElevenLabs Scribe V2
│   │   ├── report_fill.py      # Claude AI placeholder filling
│   │   ├── report_generate.py  # docxtpl DOCX rendering
│   │   ├── push.py             # Expo push notifications
│   │   └── ws_manager.py       # In-process WebSocket connection manager
│   └── tasks/
│       └── pipeline.py         # ARQ task: transcribe → fill → generate
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx         # Root layout, QueryClient, WS + push setup
│   │   ├── (auth)/             # Login, Signup, Welcome screens
│   │   └── (tabs)/             # Main tab navigation
│   │       ├── index.tsx       # Dashboard
│   │       ├── record.tsx      # Record/upload audio + pipeline status
│   │       ├── appointments/
│   │       ├── reports/
│   │       └── more/           # Profile, patients, templates, settings
│   ├── hooks/
│   │   ├── useRecording.ts     # expo-av recording + upload state machine
│   │   ├── useWebSocket.ts     # Subscribe to WS events
│   │   └── usePipelineStatus.ts# Pipeline progress from WS events
│   ├── lib/
│   │   ├── supabase.ts         # Supabase JS client (SecureStore session)
│   │   ├── api.ts              # Axios instance with JWT injection
│   │   └── wsManager.ts        # Singleton WS manager with reconnect
│   ├── services/api/           # Real API service calls
│   ├── stores/
│   │   └── authStore.ts        # Zustand auth state (Supabase)
│   └── constants/
│       └── config.ts           # USE_MOCK flag, API_BASE_URL
└── extras/                     # Original CLI pipeline scripts
```

---

## Environment Setup

### 1. Copy the sample env file

```bash
cp .env.sample .env
```

### 2. Fill in `.env` (project root)

```env
# ── Supabase ──────────────────────────────────────────────────
# Dashboard → your project → Settings (gear) → API

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...          # "anon" key
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # "service_role" key
SUPABASE_JWT_SECRET=              # JWT Secret (optional fallback)

# ── Database ──────────────────────────────────────────────────
# Dashboard → Settings → Database → Connection string → URI tab
# Use "Transaction" mode (port 6543) — prepend postgresql+asyncpg://

DATABASE_URL=postgresql+asyncpg://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres

# ── Redis ─────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── AI ────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...        # Optional fallback

# ── Speech-to-Text ────────────────────────────────────────────
ELEVENLABS_API_KEY=sk_...
DEEPGRAM_API_KEY=...              # Optional fallback
GOOGLE_API_KEY=...                # Optional fallback

# ── Provider selection ────────────────────────────────────────
STT_PROVIDER=elevenlabs           # elevenlabs | deepgram | assemblyai
AI_PROVIDER=anthropic             # anthropic | openai
AI_MODEL=claude-opus-4-6

# ── App ───────────────────────────────────────────────────────
DEBUG=false
API_BASE_URL=https://<your-ngrok-id>.ngrok-free.app  # See ngrok section
```

### 3. Create `mobile/.env.local`

```env
EXPO_PUBLIC_API_URL=https://<your-ngrok-id>.ngrok-free.app
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> The mobile app reads `EXPO_PUBLIC_*` vars at build time. These must match your Supabase project.

---

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project → fill in name and database password.

### 2. Get your API credentials

**Dashboard → Project → Settings (gear icon) → API**

| Field | Env var |
|-------|---------|
| Project URL | `SUPABASE_URL` |
| `anon` API key | `SUPABASE_ANON_KEY` |
| `service_role` API key | `SUPABASE_SERVICE_ROLE_KEY` |
| JWT Secret (JWT Settings section) | `SUPABASE_JWT_SECRET` |

### 3. Get the database connection string

**Dashboard → Settings → Database → Connection string → URI tab → Transaction mode (port 6543)**

Copy the URI, replace `postgresql://` with `postgresql+asyncpg://`, and paste into `DATABASE_URL`.

### 4. Create Storage buckets

**Dashboard → Storage → New bucket** — create these three buckets:

| Bucket name | Purpose | Visibility |
|-------------|---------|------------|
| `audio` | Uploaded/recorded audio files | Private |
| `reports` | Generated DOCX and PDF reports | Private |
| `templates` | Doctor DOCX report templates | Private |

### 5. Enable Email Auth

**Dashboard → Authentication → Providers → Email** — ensure it is enabled (it is by default).

---

## Redis Setup

Redis is required for the ARQ background worker.

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis

# Verify
redis-cli ping
# Expected: PONG
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install redis-server
sudo systemctl enable --now redis-server
redis-cli ping
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

---

## Backend Setup & Run

### 1. Install Python dependencies

Run from the **project root** (not from inside `backend/`):

```bash
cd /path/to/MedGen-v2

pip install -r backend/requirements.txt
```

> If using a virtual environment (recommended):
> ```bash
> python3 -m venv .venv
> source .venv/bin/activate   # macOS/Linux
> # .venv\Scripts\activate    # Windows
> pip install -r backend/requirements.txt
> ```

### 2. Verify the installation

```bash
python3 -c "from backend.main import app; print('OK')"
```

Expected output: `OK`

### 3. Start the API server

```bash
uvicorn backend.main:app --reload
```

The server starts at **http://localhost:8000**

| URL | Purpose |
|-----|---------|
| http://localhost:8000/docs | Interactive Swagger UI |
| http://localhost:8000/redoc | ReDoc documentation |
| http://localhost:8000/health | Health check |

> `--reload` watches for file changes and restarts automatically. Remove it for production.

---

## Database Migrations

Alembic manages the database schema. Run migrations **after** setting up your Supabase database.

> **Important:** Migrations use the synchronous psycopg2 driver (port 5432), not the async transaction pooler. Use the **Session** mode connection string for migrations.

### 1. Get the session-mode connection string

**Dashboard → Settings → Database → Connection string → URI tab → Session mode (port 5432)**

### 2. Generate and apply migrations

```bash
# Generate a migration from your ORM models
alembic revision --autogenerate -m "initial"

# Apply migrations (replace with your session-mode URL)
DATABASE_URL="postgresql://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  alembic upgrade head
```

Or set a temporary env var:

```bash
export DATABASE_URL="postgresql://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres"
alembic upgrade head
unset DATABASE_URL
```

### 3. Verify

Check the Supabase dashboard under **Table Editor** — you should see 13 tables: `profiles`, `patients`, `appointments`, `recordings`, `reports`, `processing_jobs`, `templates`, `transcripts`, `notifications`, `audit_logs`, `clinics`, `doctor_clinics`, `credit_accounts`, `credit_transactions`.

---

## ARQ Worker Setup & Run

The worker processes background pipeline jobs (transcribe → fill → generate). It requires Redis to be running.

### Start the worker

```bash
# From the project root (not backend/)
python -m arq backend.worker.WorkerSettings
```

The worker:
- Listens on `REDIS_URL` for queued jobs
- Runs up to 10 concurrent jobs
- Times out jobs after 10 minutes
- Publishes progress to Redis pub/sub AND WebSocket connections

> The worker must be running for any audio upload to produce a report. If the worker is not running, the job will remain queued in Redis until the worker starts.

---

## Mobile App Setup & Run

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Create `mobile/.env.local`

```bash
cat > mobile/.env.local << 'EOF'
EXPO_PUBLIC_API_URL=https://<your-ngrok-id>.ngrok-free.app
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EOF
```

### 3. Start the Expo dev server

```bash
cd mobile
npm start
```

This opens the Expo Metro bundler. Then:

| Platform | Command | Requirement |
|----------|---------|-------------|
| iOS Simulator | Press `i` in terminal | Xcode installed (macOS only) |
| Android Emulator | Press `a` in terminal | Android Studio + emulator |
| Physical device | Scan QR code | [Expo Go](https://expo.dev/go) app installed |
| Web browser | Press `w` in terminal | Any browser |

**Direct commands:**
```bash
npm run ios       # Open iOS simulator
npm run android   # Open Android emulator
npm run web       # Open in browser
```

### 4. Physical device testing

1. Install the **Expo Go** app on your phone (iOS App Store / Google Play)
2. Ensure phone and computer are on the **same Wi-Fi network**, OR use ngrok
3. Scan the QR code shown in the terminal

> For the API calls to work on a physical device, you **must** use ngrok (see below) because `localhost` on your computer is not reachable from your phone.

---

## Local Development with ngrok

The mobile app needs to reach your local backend. ngrok creates a public HTTPS tunnel to `localhost:8000`.

### 1. Install and authenticate ngrok

```bash
brew install ngrok
ngrok config add-authtoken <your-ngrok-authtoken>
```

Get your auth token at [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).

### 2. Start the tunnel

```bash
ngrok http 8000
```

You will see output like:
```
Forwarding  https://eb6e-2a02-ce0.ngrok-free.app -> http://localhost:8000
```

### 3. Update environment variables

Copy the `https://...ngrok-free.app` URL and set it in **both** env files:

**`.env` (project root):**
```env
API_BASE_URL=https://eb6e-2a02-ce0.ngrok-free.app
```

**`mobile/.env.local`:**
```env
EXPO_PUBLIC_API_URL=https://eb6e-2a02-ce0.ngrok-free.app
```

Then restart both the backend server and Expo dev server.

> The ngrok URL changes every time you restart ngrok (on the free plan). Update both env files each time.

---

## Running Everything Together

Open **four terminal windows/tabs**:

**Terminal 1 — Redis** (if not already running as a service):
```bash
redis-server
```

**Terminal 2 — Backend API:**
```bash
cd /path/to/MedGen-v2
source .venv/bin/activate   # if using venv
uvicorn backend.main:app --reload
```

**Terminal 3 — ARQ Worker:**
```bash
cd /path/to/MedGen-v2
source .venv/bin/activate   # if using venv
python -m arq backend.worker.WorkerSettings
```

**Terminal 4 — Mobile App:**
```bash
cd /path/to/MedGen-v2/mobile
npm start
```

**Terminal 5 — ngrok (for physical device):**
```bash
ngrok http 8000
```

### Startup order

```
1. Redis
2. Backend API
3. ARQ Worker
4. ngrok (if needed)
5. Update API_BASE_URL in both .env files
6. Mobile app
```

---

## API Reference

All endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header, except `/health`.

### Health

```
GET /health
→ {"status": "ok", "version": "0.1.0"}
```

### Profile

```
GET    /me                   — Get current user profile
PATCH  /me                   — Update profile (full_name, phone, expo_push_token, avatar_url)
POST   /profiles/setup       — Create profile row after signup (idempotent)
```

### Patients

```
GET    /patients             — List all patients
POST   /patients             — Create patient
GET    /patients/{id}        — Get patient
PATCH  /patients/{id}        — Update patient
DELETE /patients/{id}        — Delete patient
```

### Appointments

```
GET    /appointments         — List appointments (sorted by date desc)
POST   /appointments         — Create appointment
GET    /appointments/{id}    — Get appointment
PATCH  /appointments/{id}    — Update appointment
DELETE /appointments/{id}    — Delete appointment
```

### Recordings

```
POST   /recordings/upload    — Upload audio, create report, enqueue pipeline
         Form fields: appointment_id (UUID), template_id (UUID),
                      source (app_recorded|uploaded), duration_s (int),
                      file (audio/mp3|wav|m4a|ogg|webm)
         Response: {recording_id, report_id, job_id, status: "queued"}
         Status: 202 Accepted

GET    /recordings/{id}      — Get recording details
```

### Reports

```
GET    /reports              — List all reports
GET    /reports/{id}         — Get report
PATCH  /reports/{id}/fields  — Save field edits (body: {field_name: value, ...})
POST   /reports/{id}/approve — Approve report
GET    /reports/{id}/download?format=docx|pdf
                             — Get signed download URL (60 min expiry)
```

### Notifications

```
GET    /notifications        — List notifications (last 50)
POST   /notifications/mark-read
         Body: {ids: ["uuid1", "uuid2"]}
```

### Templates

```
GET    /templates            — List doctor's templates
POST   /templates/onboard    — Start template onboarding (Phase 3)
```

---

## Real-time Events

### WebSocket — `/ws/notifications?token={jwt}`

Connect with the user's JWT as a query param (WebSocket does not support headers):

```
ws://localhost:8000/ws/notifications?token=eyJ...
```

**Incoming event types:**

```json
{"type": "connected", "user_id": "uuid"}

{"type": "pipeline_update",
 "report_id": "uuid",
 "step": "transcribe|fill|generate|done|error",
 "message": "Human-readable status",
 "status": "in_progress|done|error"}

{"type": "notification",
 "title": "Report Ready",
 "body": "Your report has been generated.",
 "data": {"report_id": "uuid"}}
```

The mobile app maintains a singleton WebSocket connection (`mobile/lib/wsManager.ts`) with automatic exponential-backoff reconnection.

### SSE — `/jobs/{job_id}/stream?token={jwt}`

Server-Sent Events stream for a specific job. Emits the same pipeline step events until `step: done` or `step: error`.

```
GET /jobs/{report_id}/stream?token=eyJ...
Content-Type: text/event-stream

data: {"step": "transcribe", "status": "running", "report_id": "uuid"}
data: {"step": "fill", "status": "running", "report_id": "uuid"}
data: {"step": "generate", "status": "running", "report_id": "uuid"}
data: {"step": "done", "status": "done", "report_id": "uuid"}
```

---

## Pipeline Flow

When audio is uploaded to `POST /recordings/upload`:

```
1. Audio saved to Supabase Storage (audio bucket)
2. Recording + Report + ProcessingJob rows created in DB
3. ARQ job enqueued → returns immediately with {recording_id, report_id, job_id}

Background worker (ARQ):
4. Download audio from Storage
5. Transcribe with ElevenLabs Scribe V2
   → Publishes: {step: "transcribe", status: "done"}
6. Save Transcript row to DB
7. Extract DOCX placeholders from template
8. Fill placeholders with Claude Opus (UK English, medical-legal style)
   → Publishes: {step: "fill", status: "done"}
9. Render filled DOCX with docxtpl
   → Publishes: {step: "generate", status: "done"}
10. Upload DOCX to Supabase Storage (reports bucket)
11. Update Report status to "ready"
12. Create Notification row in DB
13. Send Expo push notification to doctor's device
    → Publishes: {step: "done", status: "done"}

Mobile app:
14. Receives pipeline_update via WebSocket
15. Progress overlay updates: Transcribing → Generating → Building → Ready
16. "View Report" button appears → navigates to report screen
```

---

## Common Issues

**`pip install` DNS errors**
Activate your virtual environment first: `source .venv/bin/activate`

**`python3 -c "from backend.main import app"` fails**
Run from the project root, not from inside `backend/`.

**WebSocket 403 errors**
The backend `/ws/notifications` route must be running. Ensure the backend started without errors.

**Mobile app can't reach API**
- Using a physical device? You must use ngrok — `localhost` doesn't route to your machine.
- ngrok URL changed? Update `API_BASE_URL` in `.env` and `EXPO_PUBLIC_API_URL` in `mobile/.env.local`.

**No templates available in the record screen**
Upload a DOCX template via the Supabase Dashboard → Storage → `templates` bucket, then create a row in the `templates` table pointing to it. Full template onboarding UI is Phase 3.

**Pipeline jobs stuck / not processing**
- Is the ARQ worker running? (`python -m arq backend.worker.WorkerSettings`)
- Is Redis running? (`redis-cli ping` → `PONG`)
- Check worker terminal for error output.

**Alembic migration fails**
Use the **Session** pooler URL (port 5432), not the Transaction pooler (port 6543). The sync psycopg2 driver requires a persistent connection.
