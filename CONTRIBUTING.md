# Contributing to Disaster Predictor (SIH 2026)

Welcome to the team! This document provides a detailed overview of **what to do**, **how to update the code**, and the strict rules we follow to ensure our team (frontend, backend, AI developers) can work together without causing merge conflicts or breaking the application.

---

## 1. Detailed Overview: What To Do

Our repository is split into a **Frontend** (React + Vite) and a **Backend** (Node.js + Express). 

### If you are a Frontend Developer:
- Your workspace is the `/frontend` directory.
- **Your Job**: Build new dashboards, integrate Leaflet maps, consume the REST APIs, and ensure the UI looks premium (TailwindCSS).
- **Core Files**: `frontend/src/App.tsx` (main state hub), `frontend/src/components/` (all dashboard tabs and maps).

### If you are a Backend Developer:
- Your workspace is the `/backend` directory.
- **Your Job**: Manage the PostgreSQL database connection, build REST APIs, fetch data from NASA EONET / GDACS, and feed real-time simulated data.
- **Core Files**: `backend/src/index.ts` (server entry), `backend/src/routes/` (API endpoints), `backend/src/services/` (external API fetchers).

---

## 2. Step-by-Step: How to Update the Code

Never push code directly to the `main` branch. Always follow this exact workflow:

### Step 1: Sync with the latest code
Before starting any new work, make sure your local `main` branch is perfectly synced with the remote repository.
```bash
git checkout main
git pull origin main
```

### Step 2: Create a new Branch
Create a branch specifically for the feature or fix you are working on. We use strict prefixes:
- `feat/`: For new features (e.g., `git checkout -b feat/advanced-digital-twin`)
- `fix/`: For bug fixes (e.g., `git checkout -b fix/map-radius-bug`)
- `docs/`: For documentation updates

### Step 3: Write your Code
Make your changes in the codebase.
- **Frontend changes:** Run `cd frontend && npm run dev` to test your changes locally.
- **Backend changes:** Run `cd backend && npm run dev` to test your APIs.

### Step 4: Commit your Changes
Write clear, descriptive commit messages so the rest of the team knows exactly what you did.
```bash
git add .
git commit -m "feat: added digital twin popup to the shelter dashboard"
```

### Step 5: Rebase and Push (Avoiding Merge Conflicts)
While you were working, someone else might have merged code into `main`. To avoid massive merge conflicts, rebase your branch on top of the newest `main`.
```bash
git fetch origin
git rebase origin/main
```
*If you get a conflict here, resolve it in your code editor, run `git add .`, and then `git rebase --continue`.*

Finally, push your branch and open a Pull Request!
```bash
git push origin your-branch-name
```

---

## 3. Strict Project Rules

1. **Environment Variables (.env)**
   - **NEVER** commit your local `.env` file to Git. It contains passwords and API keys. It is ignored in `.gitignore`.
   - If your code requires a new environment variable, add a placeholder to `.env.example` and commit that file. Announce the new requirement in the team chat.

2. **Package Dependencies**
   - Both backend and frontend use `npm`.
   - If you install a new package (e.g., `npm install axios`), make sure to commit both `package.json` and `package-lock.json`. This ensures every developer uses the exact same dependency versions.

3. **Line Endings (CRLF vs LF)**
   - Windows and Mac computers handle line breaks differently, which causes fake "merge conflicts".
   - We use a `.gitattributes` file in the root folder to force `LF` line endings across all operating systems. Do not touch or modify `.gitattributes`.

4. **In-Memory vs Postgres State**
   - We are currently migrating from an In-Memory state (`useLocalStorage` and Node Arrays) to PostgreSQL. If you build a new feature, build it using REST APIs pointing to PostgreSQL, not local storage!
