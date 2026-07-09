---
name: run-fant
description: Build, run, and drive the FANT app (MongoDB + Express backend + React/Vite frontend). Use when asked to start FANT, run its backend/frontend tests, launch it locally, take a screenshot of the donor UI, or verify a change works end-to-end in the browser.
---

FANT is a MongoDB + Express (`backend/`) + React/Vite (`frontend/`) web
app. In this container it is driven headlessly with a committed
Playwright script — `.claude/skills/run-fant/driver.mjs` — which logs in
as the seeded admin, exercises the donor create/view pages, and writes
screenshots. All paths below are relative to the repo root.

**Don't use `docker compose up`** (the human path documented in
`start_stop_fant.txt`) — in this container `docker` itself fails
(`Input/output error`; no daemon). Run the three pieces as local
processes instead; see Run (agent path) below.

## Prerequisites

`mongod` (MongoDB 8.0), Node 22, and npm are already present in this
container:

```bash
mongod --version   # mongodb-org 8.0.26, apt repo already configured
node --version     # v22.19.0
```

If `mongod` is ever missing, the apt repo is already registered at
`/etc/apt/sources.list.d/mongodb-org-8.0.list`, so `sudo apt-get install
-y mongodb-org` should work — not independently verified in this
session since it was already installed.

## Setup

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd .claude/skills/run-fant && npm install && npx playwright install chromium && cd ../../..
```

`backend/.env` already exists in this repo (FANT_DB_URI, JWT secrets,
`ADMIN_USERNAME=admin` / `ADMIN_PASSWORD=Admin@123!` for the seed
script) — nothing to configure.

## Run (agent path)

Start MongoDB, the backend, and the frontend as background processes,
polling each for readiness instead of sleeping:

```bash
# 1. MongoDB — use a scratch data dir, not the repo. Don't use --fork:
# `mongod --shutdown` doesn't reliably stop a forked instance in this
# environment; running it plain-backgrounded lets you stop it by port instead.
mkdir -p /tmp/fant-mongo-data
nohup mongod --dbpath /tmp/fant-mongo-data --port 27017 --bind_ip 127.0.0.1 \
  --logpath /tmp/fant-mongod.log > /tmp/fant-mongod-stdout.log 2>&1 &
disown
timeout 15 bash -c 'until curl -s http://localhost:27017 2>/dev/null | grep -q "MongoDB"; do sleep 0.5; done'

# 2. Backend (port 8000) — seeds the admin user on first boot
cd backend
nohup node server.js > /tmp/fant-backend.log 2>&1 &
disown
cd ..
timeout 20 bash -c 'until curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v2/donor/next-id | grep -qE "^(200|401)$"; do sleep 0.5; done'

# 3. Frontend (port 3000)
cd frontend
nohup npm run dev > /tmp/fant-frontend.log 2>&1 &
disown
cd ..
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 0.5; done'

# 4. Drive it
node .claude/skills/run-fant/driver.mjs
```

The driver logs in as `admin`/`Admin@123!`, opens `/donor/create`,
checks the Skeletal Inventory/Skeletal Analysis tab order and labels,
the Ancestry dropdown, and the 32 NAPD+Wear-Score dropdown pairs in
Dentition, submits the form to create a real donor, then repeats the
tab/label checks plus the per-tooth wear-score display on the
resulting read-only `/donor/:id` view. It prints `PASS`/`FAIL` per
check and exits non-zero if anything fails.

Screenshots land in `.claude/skills/run-fant/screenshots/` (gitignored):
`01-create-donor.png`, `02-dentition.png`, `03-donor-view.png`,
`04-donor-view-dentition.png`, and `ERROR.png` on a thrown exception.

Override via env vars if needed: `BASE_URL`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, `SCREENSHOT_DIR`.

**Stop** — kill by port, not by name/pattern (see Gotchas: `pkill -f`
with a generic string like `"vite"` can match — and kill — the very
shell that's running the `pkill` command itself):

```bash
fuser -k 3000/tcp   # frontend
fuser -k 8000/tcp   # backend
fuser -k 27017/tcp  # mongod
```

## Run (human path)

Per `start_stop_fant.txt`: on the user's actual Windows/WSL machine
with Docker Desktop running, `docker compose up` (add `--build` after
code changes) brings up all three containers, then open
`localhost:3000`. Not usable in this headless container — see above.

## Test

```bash
cd backend && npx jest                # 11 suites / 141 tests
cd frontend && npx vitest run         # 5 files / 28 tests
```

Both are independent of the running app (no live mongod/servers
needed) — they mock or exercise pure functions/components directly.

## Gotchas

- **`docker` is broken in this container** (`Input/output error` on
  `docker --version`, no running daemon) — don't waste time on the
  compose path; use the local-process path above.
- **`mongod --dbpath <path> --shutdown` does not reliably stop the
  server** in this environment — it can return without actually
  killing the process.
- **Don't stop these processes with `pkill -f "<name>"`** (e.g.
  `pkill -f "vite"` or `pkill -f "node server.js"`) — the *invoking
  shell's own command line* contains that same string (you just typed
  it as the `pkill` argument), so `pkill -f` can match and kill the
  wrapper shell itself mid-script before it reaches later commands.
  Observed directly: a 3-line stop script (`pkill node server.js` /
  `pkill vite` / `pkill mongod...` / `sleep` / `ss`) died after the
  first line with no clear error, leaving mongod and vite still
  running — the `pkill -f "vite"` line had killed the shell running
  the script. Kill by **port** instead (`fuser -k <port>/tcp`).
- **`npm run dev &` then `kill $!` doesn't stop Vite.** `$!` is the
  `npm` CLI's PID; `npm` spawns Vite as a child and can exit (or get
  killed) without Vite exiting with it, leaving the real server
  orphaned and still bound to port 3000. Killing by port sidesteps
  this — no need to track PIDs or process trees at all.
- **Ancestry/other `<Form.Select>` fields have no `controlId`**, so
  `page.getByLabel("Ancestry")` won't find them (no `for`/`id` link).
  The driver instead does
  `label.parentElement.querySelector("select")` — the label and
  control are siblings under one wrapper `<div>`.
- **Tabs start with neither active** (`activeTab` state starts
  `null`); a tab's content only mounts as "active" after it's clicked
  once. Clicking the *currently active* tab again closes it (the
  `onSelect` handler toggles to `null`) — don't double-click the same
  tab.
- **Collapsible `Card` sections** (e.g. Dentition) start collapsed;
  click the section header text to open it before asserting on its
  contents.
- Expect harmless `401`/"Refresh error" console errors on first page
  load before login — the app always attempts a token refresh on
  boot; this is not a failure.
- Playwright's `--with-deps` browser install needs `sudo`, which isn't
  available (no password, no TTY) — use plain
  `npx playwright install chromium` (no system deps flag). It worked
  fine headless in this container.
