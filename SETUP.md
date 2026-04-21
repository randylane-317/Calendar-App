# Our Calendar — Setup Guide

## Run locally

```bash
# 1. Install all dependencies
npm run install:all

# 2. Copy and fill in your env file
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to any random string

# 3. Start dev server (frontend on :5173, backend on :3001)
npm run dev
```

Open http://localhost:5173 — the first two people to visit will register their name, username, password, and pick a color. After that, registration closes.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Any long random string (e.g. `openssl rand -hex 32`) |
| `PORT` | No | Backend port (default 3001) |
| `DB_PATH` | No | Path to SQLite file (default `./data/calendar.db`) |
| `GMAIL_USER` | No | Gmail address for email reminders |
| `GMAIL_APP_PASSWORD` | No | Gmail App Password (not your regular password) — generate at myaccount.google.com/apppasswords |
| `VAPID_PUBLIC_KEY` | No | For browser push notifications |
| `VAPID_PRIVATE_KEY` | No | For browser push notifications |

### Generating VAPID keys (push notifications)
```bash
npx web-push generate-vapid-keys
```
Paste both keys into your `.env`.

---

## Deploy to Render (free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → connect your repo
3. Render will detect `render.yaml` and auto-configure everything
4. Add your env vars (Gmail credentials, VAPID keys) in the Render dashboard under **Environment**
5. Deploy — your app will be live at `https://your-app.onrender.com`

The SQLite database is stored on a 1 GB persistent disk at `/var/data/calendar.db`.

---

## First-time use

1. Open the app URL
2. Click **"Create your account"** — first person enters their name, picks a color, sets a password
3. Share the URL with your partner — they do the same
4. After two accounts exist, registration is permanently closed
5. Both of you can now log in from any device
