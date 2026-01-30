# Project Milestones: Festival Lineup Prompt Evaluator

## v1.1 Web Search Eval (Shipped: 2026-01-29)

**Delivered:** A second evaluation type using Claude's web search tools to find festival lineups from festival name + year, alongside the existing image-based evaluation.

**Phases completed:** 5-7 (6 plans total)

**Key accomplishments:**

- Tabbed workspace UI with ARIA accessibility for switching between Image Eval and Web Search Eval
- Independent prompt/model configuration per workspace with localStorage persistence
- Web search test case CRUD (create, edit, delete) with localStorage persistence
- Backend API endpoints for web search execution with batch support and cancellation
- Frontend execution hooks with progress polling and individual/batch run buttons
- Results display with expandable inline diff, aggregate metrics, and JSON export

**Stats:**

- 40 files created/modified
- +6,064 lines added (Python + JS/JSX)
- 3 phases, 6 plans
- 3 days from start to ship

**Git range:** `feat(05-01)` → `docs(07)`

**What's next:** User testing of web search prompt strategies, potential comparison tooling between eval types.

---
*Milestone completed: 2026-01-29*

---

## v1.0 MVP (Shipped: 2026-01-24)

**Delivered:** A complete prompt engineering workbench for testing Claude models against festival lineup extraction with test case management, batch execution, and results export.

**Phases completed:** 1-4 (15 plans total)

**Key accomplishments:**

- JSON-based test case persistence with atomic writes and corruption handling
- Image storage with SHA-256 deduplication and automatic optimization (1200px max, JPEG 85)
- Complete REST API for test case CRUD and image upload/download
- React frontend with test case management (create, edit, delete, thumbnails)
- Claude API integration for text and image-based lineup extraction
- Batch execution with progress tracking, cancel, and auto-navigation to results
- Results table with expandable rows, pass/fail status, and JSON export with config

**Stats:**

- 86 files created/modified
- ~4,992 lines of code (1,373 Python + 3,619 JS/JSX/CSS)
- 4 phases, 15 plans
- 3 days from start to ship

**Git range:** `feat(01-01)` → `feat(04-03)`

**What's next:** User testing to validate prompt strategies, then take winning prompt to production service.

---
*Milestone completed: 2026-01-24*
