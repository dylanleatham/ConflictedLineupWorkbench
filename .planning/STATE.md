# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Accurately measure which combination of system prompt + Claude model produces the most correct festival lineup extractions.
**Current focus:** Phase 2 - Test Management & Configuration

## Current Position

Phase: 2 of 4 (Test Management & Configuration)
Plan: 1 of TBD in current phase
Status: In progress
Last activity: 2026-01-23 — Completed 02-01-PLAN.md (Frontend foundation)

Progress: [██░░░░░░░░] 25% (1/4 phases complete, Phase 2 started)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 3.7min
- Total execution time: 0.18 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Data | 2/2 | 7min | 3.5min |
| 2. Test Management & Configuration | 1/TBD | 4min | 4.0min |

**Recent Trend:**
- Last 5 plans: 01-01 (3min), 01-02 (4min), 02-01 (4min)
- Trend: Consistent velocity

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From 01-01 (Test case persistence):**
- JSON file format (one per test case) chosen for simplicity, human-readability, git-friendliness
- Atomic write pattern (temp file + rename) prevents corruption
- Skip corrupted files with logging instead of crashing
- Delete JSON but preserve images (may be shared via content-addressing)

**From 01-02 (Image storage & REST API):**
- Hash optimized bytes, not original (deduplication based on stored content)
- Slugify + timestamp for test case IDs (simple uniqueness without database)
- CORS allow all origins for local development (needs restriction for production)
- Async FastAPI handlers for scalability

**From 02-01 (Frontend foundation):**
- Vite proxy forwards /api to http://localhost:8000 for backend communication
- API client uses centralized error handling extracting FastAPI error detail
- getImageUrl returns URL string directly for img src attributes
- 204 No Content responses handled explicitly in API client

### Pending Todos

None yet.

### Blockers/Concerns

**From Research:**
- Evaluation methodology critical: Avoid exact string matching pitfall (research recommends normalized entity comparison, but user requires strict string matching per PROJECT.md scope)
- Rate limiting needed for batch testing to avoid Claude API 429 errors
- ~~Image storage strategy must support content-addressed deduplication~~ RESOLVED: Implemented in 01-02

## Session Continuity

Last session: 2026-01-23
Stopped at: Completed 02-01-PLAN.md (Frontend foundation)
Resume file: None
Next action: Continue with next plan in Phase 2 (Test Management & Configuration)

---
*State initialized: 2026-01-22*
*Last updated: 2026-01-23 after 02-01 completion*
