# Calendar App — Codebase Guide

Shared couples calendar web app. Two fixed user accounts, color-coded events, reminders via email and browser push notifications.

## Running the app

```bash
# First time only
npm run install:all
cp .env.example .env   # then set JWT_SECRET to any random string

# Start dev (frontend :5173, backend :3001)
npm run dev

# Production build + start
npm run build
npm start
```

The frontend dev server proxies `/api/*` to `localhost:3001`, so no CORS config is needed in development.

## Project structure

```
/
├── server/               # Node.js/Express backend (CommonJS)
│   ├── index.js          # Entry point — mounts routes, starts push + scheduler
│   ├── db.js             # SQLite setup via node:sqlite (built-in Node.js module)
│   ├── middleware/
│   │   └── auth.js       # JWT cookie verification middleware
│   ├── routes/
│   │   ├── auth.js       # /api/auth — register, login, logout, /me, /users, /setup-status
│   │   ├── events.js     # /api/events — CRUD + reminder fan-out
│   │   └── push.js       # /api/push — VAPID key, subscribe, unsubscribe
│   └── services/
│       ├── email.js      # Nodemailer/Gmail reminder emails
│       ├── push.js       # web-push VAPID notification sender
│       └── scheduler.js  # node-cron job — fires every minute, sends due reminders
└── client/               # React/Vite frontend (ES modules)
    └── src/
        ├── App.jsx        # BrowserRouter + AuthProvider + route guards
        ├── api.js         # Thin fetch wrapper — all API calls go through here
        ├── context/
        │   └── AuthContext.jsx   # user, users[], login, register, logout
        ├── hooks/
        │   └── usePushNotifications.js  # Registers SW, requests permission, subscribes
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx  # Capped at 2 accounts; shows closed state after
        │   └── CalendarPage.jsx  # Main view — calendar + sidebar, owns event fetch
        └── components/
            ├── Header.jsx         # Color legend, month/week toggle, user avatar menu
            ├── EventModal.jsx     # Add/edit sheet — also runs conflict detection
            └── UpcomingEvents.jsx # Next 7 days grouped by date
```

## Database

Uses `node:sqlite` (`DatabaseSync`) — Node.js v22.5+ built-in, no native compilation. The `--disable-warning=ExperimentalWarning` flag suppresses the experimental warning in both `npm start` and `npm run dev`.

**Tables:**

- `users` — id, name, username, password_hash, email, color
- `events` — id, title, date (TEXT `YYYY-MM-DD`), start_time / end_time (TEXT `HH:MM`), notes, owner_id (NULL = shared event), created_by
- `reminders` — one row per (event, user, reminder config). When an event is saved with reminders, `insertRemindersForAllUsers` fans out one row per user per reminder setting so both users always get notified.
- `push_subscriptions` — endpoint, p256dh, auth per user device

`lastInsertRowid` from `node:sqlite` returns a BigInt. Always wrap with `Number()` before passing to further queries.

## Auth

JWT stored in an `httpOnly` cookie (`sameSite: lax`). The `authenticate` middleware in [server/middleware/auth.js](server/middleware/auth.js) verifies it on every protected route. Sessions last 30 days.

Registration is gated by `SELECT COUNT(*) FROM users` — closes permanently once 2 accounts exist. Check the current state via `GET /api/auth/setup-status`.

## Color coding

- Each user has a hex color they chose during registration
- `owner_id = NULL` means a shared event — rendered purple (`#8B5CF6`) everywhere
- The color is resolved on the frontend from the `users[]` array in `AuthContext`, not stored on the event itself

## Event conflict detection

Lives entirely in the frontend ([EventModal.jsx](client/src/components/EventModal.jsx)). `findConflicts()` checks the in-memory `events` array for same-date time overlaps using minute arithmetic. It re-runs on every form change via an inline IIFE in JSX. All-day events (no `start_time`) are excluded. The warning is advisory — saving is never blocked.

## Reminder scheduler

`startScheduler()` in [server/services/scheduler.js](server/services/scheduler.js) runs every minute via `node-cron`. It:
1. Fetches all unsent reminders (`sent_at IS NULL`)
2. Computes `sendAt = eventStart - minutes_before`
3. Fires if `now >= sendAt`
4. Marks expired reminders (event started > 1 hour ago) as sent without firing, to prevent spam after server restarts

Email reminders require `GMAIL_USER` + `GMAIL_APP_PASSWORD` in `.env`. Push notifications require `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`. Both are optional — the app works without them, reminders just silently skip.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes | Any long random string |
| `PORT` | No | Default 3001 |
| `DB_PATH` | No | Default `./data/calendar.db` |
| `GMAIL_USER` | No | Gmail address for email reminders |
| `GMAIL_APP_PASSWORD` | No | Gmail App Password (not your login password) |
| `VAPID_PUBLIC_KEY` | No | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | No | Same command as above |

## Deployment (Render)

`render.yaml` is included. Connect the GitHub repo on render.com and it auto-configures a web service with a 1 GB persistent disk mounted at `/var/data/` for the SQLite file. Add the env vars in the Render dashboard.

## Conventions

- **Backend is CommonJS** (`require`/`module.exports`). Don't use `import` in server files.
- **Frontend is ES modules** (`import`/`export`). `client/package.json` has `"type": "module"`.
- **No ORM** — all queries are raw SQL via `db.prepare().get/all/run()`. Keep it that way.
- **No client-side state library** — auth lives in `AuthContext`, events are fetched and owned by `CalendarPage` and passed down as props.
- **Dates** are stored as plain `TEXT` (`YYYY-MM-DD`, `HH:MM`). The frontend uses `date-fns` v2 for all date math and formatting. Don't mix in `Date` objects when building queries.
- **All API calls** go through the `api` object in [client/src/api.js](client/src/api.js). Don't call `fetch` directly in components.
