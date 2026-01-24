# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Accurately measure which combination of system prompt + Claude model produces the most correct festival lineup extractions.
**Current focus:** Phase 3 - Execution & Evaluation

## Current Position

Phase: 3 of 4 (Execution & Evaluation)
Plan: 3 of 4 complete
Status: In progress
Last activity: 2026-01-24 — Completed 03-03-PLAN.md (Frontend Execution UI)

Progress: [███████░░░] 69% (11/16 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 2.4min
- Total execution time: 0.43 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Data | 2/2 | 7min | 3.5min |
| 2. Test Management & Configuration | 6/6 | 15min | 2.5min |
| 3. Execution & Evaluation | 3/4 | 7min | 2.3min |

**Recent Trend:**
- Last 5 plans: 02-06 (5min), 03-01 (3min), 03-02 (2min), 03-03 (2min)
- Trend: Continuing Phase 3 execution

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

**From 02-02 (Test case list with card grid):**
- CSS Grid with auto-fit/minmax for responsive layout (1-4 columns without media queries)
- 16:9 aspect ratio for card images using object-fit: cover
- Entire card clickable for better UX (larger click target)
- Loading/error/empty state handling pattern established

**From 02-03 (Test case creation):**
- Replace lineup textarea content on import (simpler than append)
- No artist deduplication - user may intentionally have duplicates
- Trim whitespace and filter empty lines from ground truth input
- Blob URL lifecycle management with cleanup hooks prevents memory leaks

**From 02-05 (Prompt configuration panel):**
- useStickyState hook with lazy initialization from localStorage
- JSON serialization for localStorage values with error handling
- Namespaced localStorage keys: festival-evaluator:system-prompt, festival-evaluator:claude-model
- Sidebar layout with PromptConfig visible on all routes

**From 02-04 (Test case detail & edit):**
- Delete confirmation uses modal overlay instead of browser confirm()
- Edit page keeps existing image by default, requires explicit removal
- Image state management tracks existingImageHash + imageFile + removeImage flag
- Lineup displayed as bulleted list per CONTEXT.md requirements
- Delete flow only from detail page with confirmation dialog

**From 03-01 (Backend services):**
- Set operations for match/miss/extra breakdown (O(n) complexity)
- Case-insensitive comparison via normalize (strip + lowercase)
- Original casing preserved in result lists (matched_artists uses ground truth casing)
- Multiple JSON parse strategies for Claude's varied response formats
- 60-second default timeout for API calls (configurable)

**From 03-02 (Execution API endpoints):**
- In-memory batch state storage (no persistence across restarts)
- UUID for batch identification (globally unique)
- Cancelled flag checked before each test (graceful cancellation)
- Failed tests don't stop batch - continue to next test
- Average accuracy calculated only from successful tests

**From 03-03 (Frontend Execution UI):**
- Shared localStorage keys with PromptConfig for consistent config
- Run Image Test button only shown when test case has image_hash
- Color-coded accuracy: green (matched), red (missed), orange (extra)
- Perfect 100% accuracy gets celebratory styling

### Pending Todos

None yet.

### Blockers/Concerns

**From Research:**
- Evaluation methodology critical: Avoid exact string matching pitfall (research recommends normalized entity comparison, but user requires strict string matching per PROJECT.md scope)
- Rate limiting needed for batch testing to avoid Claude API 429 errors
- ~~Image storage strategy must support content-addressed deduplication~~ RESOLVED: Implemented in 01-02

**From 02-02 (Git history issue):**
- Plans executed out of order: 02-02 Task 1 committed (4075956), then 02-03 and 02-05 executed, creating TestCaseCard before 02-02 Task 2 completed
- Commit 4075956 imports TestCaseCard which doesn't exist until e8373f6 (02-05)
- Not a runtime issue (HEAD state is correct), but affects git bisect and historical checkout
- Consider interactive rebase if clean git history is critical for debugging

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed 03-03-PLAN.md
Resume file: None
Next action: Execute 03-04-PLAN.md (Batch Execution UI)

---
*State initialized: 2026-01-22*
*Last updated: 2026-01-24 after 03-03 completion*
