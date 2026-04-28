# Phase 2: Dev Scripts & Package Cleanup

**Priority:** MEDIUM
**Files:** `start-dev.cjs`, `stop-dev.cjs`, `package.json`, `.husky/pre-commit`

---

## Context

Dev scripts work but have fragile detection, no graceful shutdown, and package.json has redundant scripts. Pre-commit hook tries to run E2E tests which require live servers.

## Implementation Steps

### 1. Harden start-dev.cjs — add timeout + healthcheck

Current: waits for stdout string `'Server running on port'` with no timeout.
Fix: Add 30s timeout and HTTP healthcheck polling as backup.

```javascript
// Add timeout fallback
const BACKEND_TIMEOUT_MS = 30000;
const timeout = setTimeout(() => {
  console.error('Backend failed to start within 30s');
  backend.kill();
  process.exit(1);
}, BACKEND_TIMEOUT_MS);

// Clear timeout when backend ready
function startFrontend() {
  clearTimeout(timeout);
  // ... existing code
}
```

### 2. Harden stop-dev.cjs — graceful shutdown

Current: sends `kill -9` (SIGKILL) immediately.
Fix: SIGTERM first, wait 5s, then SIGKILL.

```javascript
// Replace kill -9 with graceful shutdown
exec(`kill -TERM ${pids.join(' ')}`, (err) => {
  // Wait 5s then force kill if still running
  setTimeout(() => {
    exec(`kill -9 ${pids.join(' ')} 2>/dev/null`);
  }, 5000);
});
```

### 3. Clean up redundant package.json scripts

Remove:
- `dev:frontend` (identical to `dev`)
- `dev:fullstack` (identical to `start`)
- `test:unit` (identical to `test`)

Fix:
- `build:frontend` — remove `--mode development` (should produce production build)

### 4. Fix pre-commit hook

Current: runs `test:ci` which includes E2E tests (requires live servers, always fails).
Fix: Pre-commit should only run lint + type-check + unit tests.

```bash
# .husky/pre-commit
npx lint-staged
npm run type-check
npm run test
```

## Todo

- [ ] Add 30s timeout to start-dev.cjs
- [ ] Change stop-dev.cjs to SIGTERM → wait → SIGKILL
- [ ] Remove redundant scripts from package.json
- [ ] Fix build:frontend to use production mode
- [ ] Fix pre-commit hook to skip E2E

## Success Criteria

- `npm start` times out cleanly if backend fails
- `npm stop` sends graceful shutdown signal
- No duplicate scripts in package.json
- Pre-commit hook passes without live servers

## Risk

- Changing pre-commit hook means E2E is no longer gated pre-push — should be CI-only
- Removing `dev:frontend` script may break if referenced in docs (check CLAUDE.md)
