# FANT

A cadaver tracking tool for the Forensic Osteology Research Station (FOREST) at Western Carolina University.

## Key Features

- User management
  - Access control with a 4-bit permission bitmask
- Cadaver data tracking
  - Identification details
  - Skeletal and dental completeness
  - Osteometric measurements
  - Notes
- Cadaver versioning

## Table of Contents

- [Why?](#why)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Development Environment](#development-environment)
  - [Docker](#docker)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Access Level Bitmask](#access-level-bitmask)
- [What Changed](#what-changed)
- [Bugs Fixed](#bugs-fixed)

## Why?

The Forensic Anthropology (FA) program in the department of Anthropology and Sociology at Western Carolina University (WCU) maintains a body farm known as the Forensic Osteology Research Station or FOREST. The purpose of such a body farm is to track the decay of cadavers over time and under various conditions. Data recorded from body farms can be used to better understand the decomposition process. This knowledge is often very useful to law enforcement, helping to pinpoint a victim's time of death. Currently the FA program at WCU collects cadaver data on paper and stores it in a "difficult-to-navigate" database. The goal for this project is to transform this process, making it as painless as possible.

## Getting Started

The goal of this documentation is to assist future maintainers, likely another capstone team. We are assuming little to no knowledge of involved technologies, as that is the position we were in when starting.

### Installation

FANT is a [MERN](https://www.mongodb.com/mern-stack) stack application. You will need:

- [Node 20+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- A MongoDB database
  - We recommend using a cloud platform like [MongoDB Atlas](https://www.mongodb.com/atlas) while in development — this lets all developers share the same data.
  - You will need to set your database URL in the backend `.env` file.
- FANT source code — clone this repository

Once you have the source code, install dependencies for the backend and frontend separately:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

Copy the example environment files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Development Environment

Both the frontend and backend have development launchers that restart automatically when changes are made. They are separate programs and must be launched independently — we recommend using a split terminal or a terminal multiplexer like `tmux`.

```bash
# Terminal 1 — backend (runs on port 8000)
cd backend
npm run dev

# Terminal 2 — frontend (runs on port 3000)
cd frontend
npm run dev
```

Vite's dev server proxies `/api` requests to the backend automatically (configured in `vite.config.js`), so no CORS issues during development.

### Docker

The recommended way to run FANT for non-development use. Docker handles the backend, frontend, and MongoDB together.

```bash
# Copy and fill in backend .env first
cp backend/.env.example backend/.env

# First run or after code changes
docker compose up --build

# Subsequent runs (no code changes)
docker compose up
```

The app will be available at `http://localhost:3000`. The default admin credentials are set by `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env` — the server seeds this user automatically on first startup.

---

## Scripts

### Backend (`cd backend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend with nodemon (auto-restarts on changes) |
| `npm start` | Start backend without auto-restart |
| `npm test` | Run backend test suite (Jest) |
| `npm run seed:admin` | Manually seed the admin user (idempotent) |

### Frontend (`cd frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build for production (output to `dist/`) |
| `npm test` | Run frontend test suite (Vitest) |

---

## Project Structure

```
fant/
├── backend/
│   ├── assets/
│   │   ├── skeletal_inventory_homunculus.png
│   │   ├── skeleton.svg
│   │   └── trauma_homunculus.png
│   ├── config/
│   │   └── corsOptions.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── donorController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── accessChecker.js
│   │   ├── archivedFilter.js
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── loginLimit.js
│   ├── models/
│   │   ├── Donor.js
│   │   ├── Version.js
│   │   ├── User.js
│   │   ├── donorDAO.js
│   │   ├── userDAO.js
│   │   └── versionDAO.js
│   ├── reference/
│   │   ├── skeletal-inventory.pdf
│   │   └── williams-collection-forms.docx
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── donorRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/
│   │   ├── migrateRecorderDate.js
│   │   └── seedAdmin.js
│   ├── utilities/
│   │   ├── htmlTemplate.js
│   │   ├── passwordChecking.js
│   │   ├── permissions.js
│   │   └── williamsData.js
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── misc/          (ErrorHandling, NotFound)
│   │   │   ├── route-protection/ (PrivateRoute, ProtectedRoute, PublicRoute)
│   │   │   ├── AdminPanel.js
│   │   │   ├── Dashboard.js
│   │   │   ├── DonorView.js
│   │   │   ├── Homunculus.js
│   │   │   ├── Landing.js
│   │   │   ├── Login.js
│   │   │   ├── ModifyDonor.js
│   │   │   ├── NavigationBar.js
│   │   │   └── ResetPassword.js
│   │   ├── contexts/
│   │   │   └── AppContext.js
│   │   ├── services/
│   │   │   ├── adminDataService.js
│   │   │   ├── authDataService.js
│   │   │   ├── authService.js
│   │   │   ├── axiosConfig.js
│   │   │   ├── donorDataService.js
│   │   │   ├── userDataService.js
│   │   │   └── williamsForm.js
│   │   ├── utilities/
│   │   │   └── permissions.js
│   │   ├── App.js
│   │   └── main.jsx
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

### Backend

- `config/` — Server configuration (CORS options)
- `controllers/` — Route handler logic
- `models/` — Mongoose schemas and data access objects (DAOs) that interact with MongoDB
- `middleware/` — Code that requests pass through before reaching controllers (auth checks, logging, rate limiting)
- `routes/` — Maps incoming requests to the appropriate controllers
- `scripts/` — Utility scripts (`seedAdmin.js` to bootstrap the first admin user, `migrateRecorderDate.js` for a one-time data migration)
- `utilities/` — Shared helper functions
- `assets/` — Images embedded in generated PDFs
- `reference/` — Blank source forms served to the frontend (skeletal inventory PDF, Williams collection forms)
- `server.js` — Entry point

### Frontend

- `src/components/` — All UI components. Top-level components map to pages; subdirectories hold supporting components.
- `src/contexts/` — React context providers for managing shared state (auth, API access)
- `src/services/` — API communication layer (Axios config, per-resource data services)
- `src/utilities/` — Shared helper functions
- `index.html` — Vite entry HTML
- `main.jsx` — React entry point
- `nginx.conf` — Nginx config used in the production Docker image

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `FANT_DB_URI` | MongoDB connection URI |
| `ACCESS_TOKEN_SECRET` | Secret for signing access JWTs |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh JWTs |
| `PORT` | Server port (default: 8000) |
| `NODE_ENV` | `development` or `production` (controls secure cookie) |
| `ADMIN_USERNAME` | Username for the auto-seeded admin account |
| `ADMIN_PASSWORD` | Password for the auto-seeded admin account |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full backend API URL. Leave blank in dev to use Vite proxy. Note: Vite requires the `VITE_` prefix. |

---

## Access Level Bitmask

The access system uses a 4-bit bitmask (0–15):

| Bit | Meaning |
|-----|---------|
| bit 3 (0x8) | Immutable — cannot be modified by any admin |
| bit 2 (0x4) | Can read donors |
| bit 1 (0x2) | Can write/modify donors |
| bit 0 (0x1) | Is admin (user management) |

Common levels: `0` = no access, `7` = full (read+write+admin), `15` = super-admin (immutable).

---

## What Changed

### Technology Upgrades

| Component | Before | After |
|-----------|--------|-------|
| MongoDB driver | `mongodb` (raw driver, manual `injectDB`) | `mongoose` 8.x (ODM with schemas) |
| Node | Any | 20 LTS |
| React | 18 (CRA) | 18 (Vite) |
| JWT refresh token lookup | By username | By userID (more reliable) |
| Docker base image | Not specified | `node:20-alpine` / `nginx:alpine` |

---

## Bugs Fixed

### Backend

#### `server.js`
- **Deprecated MongoDB options** — `useNewUrlParser: true` and `wtimeoutMS` are no longer accepted in recent MongoDB driver versions and caused startup warnings. Removed; Mongoose 7+ needs no connection options for basic usage.
- **DAO injection pattern removed** — The original used a module-level `injectDB(client)` pattern that required careful startup ordering and could silently fail if the DB wasn't ready. Replaced with Mongoose models that connect automatically.

#### `controllers/authController.js`
- **`secure: false` on JWT cookie** — The refresh token cookie had `secure: false` hardcoded, meaning it would be sent over plain HTTP even in production. Now reads `process.env.NODE_ENV === "production"` and sets the flag accordingly.
- **Missing `logout` handler** — `authRoutes.js` registered `POST /logout → AuthCtrl.logout` but `authController.js` never exported a `logout` function. Any logout request would crash with `AuthCtrl.logout is not a function`. Implemented properly: clears the JWT cookie and returns 200.
- **Refresh token stored username, not userID** — The refresh token payload was `{ username }`. A comment in the original code even noted *"this could be causing the error when updating your own account"* — if a user's username was updated, the old refresh token would fetch the wrong user on the next refresh. Changed to store `{ userID }` and look up via `getUserByID`.

#### `controllers/donorController.js`
- **`Boolean(req.query.archived)` always `true`** — Query strings are always strings. `Boolean("false") === true`, so the archived filter was never actually `false` when the frontend sent `archived=false`. Fixed to `req.query.archived === "true"`.
- **`addNewDonorVersion` hash comparison used joined data** — The change-detection hash compared `donor.data` (the incoming update) against `prevDonor.data` where `prevDonor` came from `getDonorByID` — which is an aggregation pipeline that joins and reshapes data. The shapes could be subtly different, making the hash always differ or always match depending on field ordering. Now compares using the same data structure on both sides.
- **`getPDF` imported puppeteer but crashed if absent** — `puppeteer` was listed as a dependency and imported unconditionally, but was not in `package.json`. Any PDF request crashed the server. Changed to a dynamic `require()` inside a try/catch that falls back to returning raw HTML if puppeteer isn't available.
- **`compare()` diff function didn't guard against null objects** — `Object.keys(newVer)` would throw if either version's `versionData` was `null` or `undefined`. Added null guards.

#### `controllers/userController.js`
- **`req.status(400)` typo** — In `getAllUsers`, the no-users-found branch called `req.status(400).json(...)` instead of `res.status(400).json(...)`. `req` has no `.status()` method; this would throw an unhandled error on every empty user list request.
- **`if (access)` skips `access = 0`** — In both `updateUser` and `generateUpdatedUser`, the guard `if (access)` is falsy when `access === 0`. This made it impossible to demote a user to access level 0 through the API — the field would always be silently skipped. Fixed to `if (access !== undefined)`.
- **`resetPassword` used username lookup** — `resetPassword` fetched the user with `getUserFromUsername(req.username)` where `req.username` comes from the JWT. If the user had recently changed their username, the JWT would still carry the old username and the lookup would fail. Fixed to use `getUserByID(req.userID)`.

#### `models/donorDAO.js` (formerly `dao/donorDAO.js`)
- **Pagination applied after aggregation** — The original `getDonors` ran a `$lookup`-heavy aggregation pipeline to join version and user data, then called `.limit().skip()` on the resulting cursor. This fetched *all* matching documents from MongoDB and discarded most of them in the driver. Fixed to use `$facet` with `$skip`/`$limit` stages inside the aggregation pipeline so MongoDB only returns the requested page.
- **`numDonors` returned `donorsList.length`** — Because pagination was done post-aggregation, `numDonors` was always at most `donorsPerPage` (e.g. always ≤ 10). The total count shown in the UI was wrong. The `$facet` fix also returns a correct `totalCount`.
- **`isMostRecentVersion` used `.find().next()`** — The raw driver's `.find().next()` is valid but Mongoose models use `.findOne()`. Also, there was no `await` on the inner `.find()` call in the original, meaning `donor` could be a cursor rather than a document. Fixed to `Donor.findOne().lean()`.
- **`deleteArchivedDonor` projection syntax** — `donors.find({ donorID: id }, { archived: 1, _id: 0 }).limit(1).next()` passes the projection as the second argument to `.find()`, which is a raw driver syntax. In Mongoose the second argument to `.find()` is the projection but `.find()` returns a Query, not a cursor with `.next()`. Fixed to `Donor.findOne({ donorID: id }, { archived: 1 }).lean()`.
- **`restoreVersion` used a complex pipeline that could fail** — The original `restoreVersion` ran an aggregation to find version IDs to remove by comparing `modificationTime`. This could miss versions if timestamps had sub-millisecond differences or were equal. The new implementation uses the `versions` array on the donor document directly — the array is kept in insertion order with newest first, so slicing at the target version is reliable.

#### `models/userDAO.js` (formerly `dao/userDAO.js`)
- **Error path returned `{ UsersList: [] }` (capital U)** — The `getUsers` error path returned `{ UsersList: [], numUsers: 0 }` while the success path returned `{ usersList, numUsers }`. The controller destructured `{ usersList }` (lowercase), so errors silently returned `undefined` instead of an empty array. Consistent lowercase throughout.
- **`aggregate` used for simple lookups** — `getUserByID` and `getUserFromUsername` used aggregation pipelines purely for `$project` (to exclude password). Replaced with `findOne(..., { password: 0 }).lean()` which is simpler, faster, and equally safe.

#### `middleware/accessChecker.js`
- **`authChecker` missing `else` for already-authenticated path** — If `req.username`, `req.access`, and `req.userID` were already set, the function returned `undefined` without calling `next()`, stalling the request. Added explicit `return next()`.
- **`adminChecker` not exported** — Routes imported `adminChecker` from `accessChecker` but the original file only exported `authChecker` and `accessChecker`. `adminChecker` was implicitly `undefined`, making all admin routes always pass. Now exports `readChecker`, `writeChecker`, `adminChecker` as pre-built middleware.

### Frontend

#### `services/axiosConfig.js`
- **`this.axios.request()` → `this.instance.request()`** — The token refresh retry code called `this.axios.request(originalRequest)` to retry the failed request, but `this.axios` is the `AxiosConfig` *class instance* (not the Axios HTTP client). The Axios client is `this.instance`. The retry would silently throw `this.axios.request is not a function`, meaning token refresh never actually retried the original request.
- **No `_retry` guard** — Without a retry flag, a 403 response on the refresh endpoint itself could trigger infinite refresh attempts. Added `originalRequest._retry` guard.

#### `services/authService.js`
- **`signup()` argument order mismatch** — `AppContext.js` calls `auth.signup(firstName, lastName, username, password, access)` but the original `AuthService.signup()` signature was `(username, password, firstName, lastName, access)`. First name and last name would be sent as username/password and vice versa. Fixed the method signature to match the call site.

#### `contexts/AppContext.js`
- **Hardcoded `localhost:5000`** — The API base URL was hardcoded to `http://localhost:5000/api/v2/`. The backend runs on port 8000. This made every API call fail out of the box unless the developer manually patched the file. Changed to read `import.meta.env.VITE_API_URL` with a fallback of `/api/v2/` (which works with Vite's proxy).

#### `components/Login.js`
- **Unused `redirect` import** — `redirect` was imported from `react-router-dom` but never used. Removed.
