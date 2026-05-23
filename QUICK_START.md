# ClassPulse — Quick Start (Local Setup)

## Run locally in 5 minutes

### 1. Clone & install
```bash
git clone https://github.com/sricharanreddycheruku/Studentgap.git
cd Studentgap
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Free at [neon.tech](https://neon.tech) → create project → copy connection string |
| `GEMINI_API_KEY` | Free at [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `GREENAPI_INSTANCE_ID` | Free at [green-api.com](https://green-api.com) → create instance → scan QR |
| `GREENAPI_API_TOKEN` | Same Green API dashboard |
| `USE_MOCK_WHATSAPP` | Set `true` to skip real WhatsApp during local testing |

### 3. Seed the database
```bash
node server/seed.js
```
This creates 2 demo teachers, 25 students, and 4 completed sessions with full AI insights so the dashboard is populated immediately.

### 4. Start the app
```bash
npm run dev
```

Open **http://localhost:5000** in your browser.
Select a teacher profile and click **Continue** to enter the dashboard.

---

## For real WhatsApp to work locally

Real WhatsApp webhooks need a public URL. Use ngrok:

```bash
# In a separate terminal:
npx ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok.io`) and set it as your webhook in the Green API dashboard:
- Webhook URL: `https://abc123.ngrok.io/api/webhook/whatsapp`

Set `USE_MOCK_WHATSAPP=false` in `.env` for real sends.

---

## Key pages

| URL | What it does |
|---|---|
| `/login` | Create or select a teacher profile |
| `/` | Dashboard — sessions, charts, risk students, insights |
| `/sessions/new` | Start a new AI-generated diagnostic session |
| `/roster` | Manage your student list |
| `/setup` | Configure Green API WhatsApp settings |

---

## Testing without a real phone

1. Create a session on the **New Session** page
2. Open the session — go to its results page
3. Use the **"Add test response"** panel to simulate WhatsApp replies
4. Click **"Analyse responses"** to run AI gap analysis
5. Click **"Send feedback"** to send WhatsApp feedback to each student

---

## Project structure

```
server/           Node.js/Express backend (CommonJS)
  config/         Database connection (PostgreSQL)
  controllers/    Route handlers (analytics, whatsapp, analysis)
  models/         PostgreSQL models (Session, Student, Teacher, Message)
  routes/         Express routers
  services/       Gemini AI, Green API WhatsApp, SSE, analytics
  utils/          Helpers (JSON parse, fallback questions)

client/           React 19 + Vite frontend
  src/
    api/          Axios client (proxies /api → localhost:3000)
    charts/       Recharts components
    components/   Shared UI (Navbar, LiveResponseFeed, ClassBreakdown…)
    pages/        Dashboard, SessionResults, Roster, Login, NewSession…
```

---

## Deploying

The production app runs on Replit at a `.replit.app` domain.
To deploy your own copy: push to this repo and connect it to Replit Deployments, or host `server/index.js` on any Node.js platform (Railway, Render, etc.) with the same `.env` values.
