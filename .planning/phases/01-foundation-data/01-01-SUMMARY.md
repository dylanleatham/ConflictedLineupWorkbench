---
phase: 01-foundation-data
plan: 01
subsystem: storage
tags: [python, fastapi, pydantic, json, pathlib]

# Dependency graph
requires: []
provides:
  - Python backend package structure with FastAPI dependencies
  - TestCase Pydantic model with id, name, image_hash, lineup fields
  - JSON-based test case persistence in .festival-tests/data/
  - CRUD operations: save, load, load_all, delete
  - Atomic write pattern preventing JSON corruption
affects: [01-02, image-storage, api, ui]

# Tech tracking
tech-stack:
  added: [fastapi, uvicorn, python-multipart, pillow, pydantic]
  patterns: [atomic-writes, content-manager-persistence, pydantic-models]

key-files:
  created:
    - backend/requirements.txt
    - backend/__init__.py
    - backend/storage/__init__.py
    - backend/storage/config.py
    - backend/storage/models.py
    - backend/storage/test_cases.py
  modified: []

key-decisions:
  - "Use JSON files (one per test case) instead of SQLite for simplicity"
  - "Implement atomic writes via temp file + rename to prevent corruption"
  - "Skip corrupted JSON files with logging instead of crashing application"
  - "Delete test case JSON but preserve images (may be shared)"

patterns-established:
  - "Atomic write pattern: tempfile.NamedTemporaryFile + Path.replace()"
  - "UTF-8 encoding with ensure_ascii=False for international characters"
  - "Graceful degradation: corrupted files logged and skipped"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 1 Plan 1: Foundation & Data Summary

**JSON-based test case persistence with Pydantic models, atomic writes, and graceful corruption handling**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-01-23T04:44:17Z
- **Completed:** 2026-01-23T04:47:27Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Backend Python package structure established with FastAPI dependencies
- TestCase Pydantic model with validation and JSON schema
- CRUD operations for test case persistence to .festival-tests/data/
- Data survives application restart (verified with test scripts)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project structure and dependencies** - `76ff980` (chore)
2. **Task 2: Create Pydantic model for test cases** - `86c3a40` (feat)
3. **Task 3: Implement test case persistence** - `c80b726` (feat)

## Files Created/Modified
- `backend/requirements.txt` - Python dependencies (FastAPI, Pydantic, Pillow, etc.)
- `backend/__init__.py` - Backend package initialization
- `backend/storage/__init__.py` - Storage package exports
- `backend/storage/config.py` - Storage paths and directory creation
- `backend/storage/models.py` - TestCase Pydantic model
- `backend/storage/test_cases.py` - CRUD operations with atomic writes

## Decisions Made

**1. JSON file format with one file per test case**
- Rationale: Simple, human-readable, git-friendly, sufficient for handful of festivals
- Alternative considered: SQLite (overkill for this scale)

**2. Atomic write pattern using temp file + rename**
- Rationale: Prevents corruption on write failures (power loss, disk full, process killed)
- Implementation: tempfile.NamedTemporaryFile + Path.replace()

**3. Skip corrupted files instead of crashing**
- Rationale: Application should degrade gracefully rather than fail completely
- Implementation: Try/except on JSON decode with logging

**4. Delete JSON but preserve images**
- Rationale: Images may be shared by multiple test cases (content-addressed)
- Implementation: Only unlink JSON file, leave image intact

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 1 Plan 2 (Image storage):**
- Backend package structure is in place
- Storage directory configuration is complete
- TestCase model ready for image_hash field usage
- CRUD operations ready to integrate with image upload functionality

**No blockers.**

---
*Phase: 01-foundation-data*
*Completed: 2026-01-22*
