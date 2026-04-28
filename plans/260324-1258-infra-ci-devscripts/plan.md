# Infrastructure Refactoring — Phase 2: CI/CD & Dev Scripts

**Branch:** `refactor/production-docker-infrastructure`
**Status:** Pending (Phase 1 complete — Docker + code fixes + vulnerabilities)

---

## Overview

Remaining work from infrastructure audit. Two independent streams:
1. CI pipeline modernization
2. Dev script hardening + package.json cleanup

## Phases

| # | Phase | Priority | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | [CI Pipeline Modernization](phase-01-ci-pipeline.md) | HIGH | ~30min | Pending |
| 2 | [Dev Scripts & Package Cleanup](phase-02-dev-scripts-cleanup.md) | MEDIUM | ~20min | Pending |

## Dependencies

- Phase 1 and 2 are independent — can be done in parallel or any order
- Both depend on Phase 1 (Docker + code fixes) being complete ✓

## Key Files

- `.github/workflows/ci.yml` — CI pipeline
- `start-dev.cjs` — dev startup script
- `stop-dev.cjs` — dev shutdown script
- `package.json` — root scripts
- `.husky/pre-commit` — pre-commit hooks
