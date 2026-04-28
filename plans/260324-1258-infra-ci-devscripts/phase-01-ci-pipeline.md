# Phase 1: CI Pipeline Modernization

**Priority:** HIGH
**File:** `.github/workflows/ci.yml`

---

## Context

Current CI is minimal — runs frontend lint/type-check/test only, no DB, no backend tests, outdated actions, no caching. Server has no test script at all.

## Requirements

### Functional
- Backend tests must run in CI with real PostgreSQL
- Frontend and backend failures reported separately
- Security audit with explicit severity threshold

### Non-functional
- CI should complete in <5 minutes
- npm cache to avoid re-downloading packages every run

## Implementation Steps

### 1. Update actions versions
- `actions/checkout@v3` → `actions/checkout@v4`
- Already has `actions/setup-node@v4` ✓

### 2. Add npm caching
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'npm'
    cache-dependency-path: |
      package-lock.json
      server/package-lock.json
```

### 3. Split into 2 jobs: frontend + backend

**Frontend job:**
- npm ci
- lint
- type-check
- unit tests (vitest)
- npm audit --audit-level=high

**Backend job:**
- PostgreSQL service container
- npm ci (server/)
- prisma generate + migrate deploy
- npm audit --audit-level=high (server/)
- (Future: add test script when backend tests exist)

### 4. Add PostgreSQL service to backend job
```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: report_fusion_hub_test
    ports: ['5432:5432']
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### 5. Add concurrency control
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 6. Pin node version
Use `20.x` (latest LTS patch) instead of bare `20`

## Todo

- [ ] Update checkout action to v4
- [ ] Add npm cache with dual lock file paths
- [ ] Split into frontend + backend jobs
- [ ] Add PostgreSQL service to backend job
- [ ] Add prisma generate + migrate in backend job
- [ ] Add --audit-level=high to both audit commands
- [ ] Add concurrency cancel-in-progress
- [ ] Pin node version to 20.x

## Success Criteria

- CI passes on current branch
- Frontend and backend are separate jobs
- Backend job has PostgreSQL available
- npm cache hit on second run

## Risk

- Backend has no test script yet — job will run audit + prisma only until tests are added
- Prisma migrate in CI needs a DATABASE_URL env var pointing to the service container
