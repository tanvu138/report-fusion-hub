# Infrastructure Audit Report

**Date:** 2026-03-24
**Scope:** Docker, Compose, env vars, CI/CD, dev scripts
**Goal:** Robust, simple (KISS) infrastructure for AI agent management

---

## Executive Summary

The infrastructure has **4 CRITICAL**, **9 HIGH**, and **16 MEDIUM** issues. The Docker stack is non-functional (wrong ports, missing vars, no .dockerignore). CI has no DB service so backend tests can't run. Env vars are inconsistent across 3 config surfaces (`.env.example`, `docker-compose.yml`, source code). Dev scripts work but have fragile detection and no graceful shutdown.

**Core theme:** config was authored early, then ports/vars changed in code but infra files were never updated. Docker is effectively dead code.

---

## CRITICAL (Fix Immediately)

### C1 — Docker stack uses wrong ports everywhere
- `Dockerfile` exposes 8080, `server/Dockerfile` exposes 3001
- `docker-compose.yml` maps 8080:8080, 3001:3001
- Actual app uses **6234** (frontend) and **8945** (backend)
- **Impact:** `docker compose up` produces a stack where nothing connects
- **Fix:** Update all EXPOSE, port mappings, and env vars to 6234/8945

### C2 — `VITE_API_BASE_URL` vs `VITE_API_URL` mismatch
- `docker-compose.yml` injects `VITE_API_BASE_URL=http://localhost:3001/api`
- Frontend code reads `VITE_API_URL` (no `_BASE_` prefix)
- Additionally, the `/api` suffix in the compose value would produce doubled `/api/api/` paths
- **Fix:** Use `VITE_API_URL=http://localhost:8945` everywhere

### C3 — `FILE_ENCRYPTION_KEY` absent from docker-compose
- `encryptionUtils.js` throws at module load if unset
- Docker backend container crashes on any upload route
- Also missing from `start-dev.cjs` required-vars validation
- **Fix:** Add to compose env block, `.env.example`, and startup validation

### C4 — No backend tests in CI
- `server/package.json` has no `test` script
- CI only runs `npm audit` for server — zero API/auth/workflow verification
- **Fix:** Add backend test script + wire into CI pipeline

---

## HIGH (Fix This Sprint)

### H1 — No .dockerignore files
- `COPY . .` sends node_modules (500MB+), `.env` (secrets), `.git` into image
- If image pushed to registry, secrets are exposed
- **Fix:** Create `.dockerignore` in root and `server/`

### H2 — Lock files commented out + `npm install` in Dockerfiles
- Both Dockerfiles have lock file COPY commented out, use `npm install`
- Non-deterministic builds — different runs produce different binaries
- **Fix:** Uncomment `COPY package-lock.json ./`, use `npm ci`

### H3 — Dev-only Dockerfiles, no production builds
- Both images run `npm run dev` (nodemon/vite dev server)
- All devDependencies included, no multi-stage build, no static serving
- **Fix:** Add multi-stage builds (builder + production stages)

### H4 — `dotenv` path is CWD-relative in server
- `server/server.js:14` — `require('dotenv').config({ path: '../.env' })`
- Works when CWD is `/server`, fails inside Docker or if started from different dir
- **Fix:** `path.resolve(__dirname, '../.env')`

### H5 — No PostgreSQL service in CI
- Tests requiring DB either error silently or skip
- No verified proof DB-layer tests pass
- **Fix:** Add `services.postgres` with healthcheck + `prisma migrate deploy`

### H6 — `actions/checkout@v3` outdated + no npm cache
- v3 uses Node 16 (EOL). v4 is current
- No cache strategy — full npm downloads every CI run
- **Fix:** `checkout@v4` + `cache: 'npm'` on `setup-node`

### H7 — Hardcoded stale `FRONTEND_URL` in `sharedReportController.js`
- Hardcoded `'http://localhost:5173'` fallback (old Vite default)
- Should use `process.env.FRONTEND_URL` exclusively
- **Fix:** Remove hardcoded fallback

### H8 — `start-dev.cjs` backend-ready detection has no timeout
- Waits for stdout string `'Server running on port'` forever
- If message format changes or nodemon prefixes differently, script hangs
- **Fix:** Add 30s timeout with HTTP healthcheck polling on `/health`

### H9 — `stop-dev.cjs` sends SIGKILL immediately
- `kill -9` bypasses Express graceful shutdown
- Leaves Prisma connections open, potential data corruption
- **Fix:** SIGTERM first, wait 5s, then escalate to SIGKILL

---

## MEDIUM (Fix Next Sprint)

| ID | Area | Issue | Fix |
|----|------|-------|-----|
| M1 | compose | `version: '3.8'` deprecated | Remove line |
| M2 | compose | postgres:15 but docs say postgres:16 | Update to `postgres:16-alpine` |
| M3 | compose | JWT secret fallback committed to repo | Use `${JWT_SECRET:?must be set}` |
| M4 | compose | No backend healthcheck, no frontend depends_on condition | Add HTTP healthcheck |
| M5 | ci | Weekly cron runs full build, not dedicated security scan | Separate security job |
| M6 | ci | `npm audit` no `--audit-level` — critical CVEs pass silently | Add `--audit-level=high` |
| M7 | ci | No `prisma generate` before `type-check` — will fail | Add step |
| M8 | ci | No job separation — frontend/backend failures conflated | Split into 2 jobs |
| M9 | ci | `node-version: 20` unpinned — nondeterministic on patch | Pin `20.x` or exact |
| M10 | pkg | Name is `vite_react_shadcn_ts` — template placeholder | Rename to `report-fusion-hub` |
| M11 | pkg | 4 overlapping start scripts (start, dev, dev:frontend, dev:fullstack) | Remove redundant aliases |
| M12 | pkg | `test` and `test:unit` identical | Remove `test:unit` |
| M13 | pkg | `generate:zod` actually runs `prisma generate` — misleading name | Rename or remove |
| M14 | pkg | `build:frontend` uses `--mode development` — unminified | Fix for production |
| M15 | husky | Pre-commit runs E2E tests — requires live servers, always fails | Limit to lint+unit |
| M16 | env | `POSTGRES_USER/PASSWORD/DB` in compose but not in `.env.example` | Document |

---

## LOW (Backlog)

| ID | Issue |
|----|-------|
| L1 | Inconsistent WORKDIR (/app vs /usr/src/app) |
| L2 | No compose resource limits (Puppeteer can OOM) |
| L3 | No CI `concurrency: cancel-in-progress` |
| L4 | No `permissions:` block in CI workflow |
| L5 | `isStale()` in start-dev.cjs uses mtime — unreliable |
| L6 | `stop-dev.cjs` uses `lsof` — macOS/Linux only |
| L7 | Puppeteer missing Alpine system deps in Dockerfiles |

---

## Recommended Env Var Inventory (Canonical)

### Backend (root `.env`)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | yes | `development` | |
| `PORT` | yes | `8945` | Single source of truth |
| `JWT_SECRET` | yes (prod) | none — fail loud | |
| `JWT_EXPIRY` | no | `12h` | |
| `DATABASE_URL` | yes | none — fail loud | |
| `FRONTEND_URL` | yes (prod) | `http://localhost:6234` | CORS |
| `FILE_ENCRYPTION_KEY` | yes | none — fail loud | AES-256-GCM |
| `LOG_LEVEL` | no | `info` | |

### Frontend (`VITE_` prefix, baked at build)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | yes | No trailing slash, no `/api` |
| `VITE_FRONTEND_PORT` | no | Default `6234` |
| `VITE_DIFY_TOKEN` | no | Feature disabled if absent |
| `VITE_DIFY_BASE_URL` | no | Feature disabled if absent |

---

## Recommended Fix Order (Implementation Phases)

### Phase 1 — Make Docker Work (C1, C2, C3, H1-H4)
Fix ports, env var names, add .dockerignore, fix lock files, fix dotenv path

### Phase 2 — Fix CI (C4, H5, H6, M5-M9)
Add backend tests, add PostgreSQL service, update actions, add caching

### Phase 3 — Harden Dev Scripts (H8, H9, M10-M15)
Timeout + healthcheck polling, graceful shutdown, clean up package.json scripts

### Phase 4 — Production Readiness (H3, M3, M4, L2, L7)
Multi-stage builds, resource limits, Puppeteer deps, healthchecks

---

## Unresolved Questions

1. Is Docker intended for production deployment or only local integration testing? Affects urgency of multi-stage builds
2. Is `server/minimal-server.js` intentional? Uses CORS wildcard + different dotenv loader
3. Do any vitest tests mock the DB, or do all require live PostgreSQL? Determines CI DB service urgency
4. Does `server/prisma/seed.js` have a `NODE_ENV !== 'production'` guard before dropping data?
5. Is `types-temp/` in `.gitignore`? If not, `npm run build` stages generated files
