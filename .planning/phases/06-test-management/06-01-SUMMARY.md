---
phase: 06-test-management
plan: 01
subsystem: ui
tags: [react, localStorage, web-search-eval, crud, hooks]

# Dependency graph
requires:
  - phase: 05-ui-foundation
    provides: Tabbed workspace with web-search-eval tab, useStickyState pattern
provides:
  - useWebSearchTests hook for CRUD operations with localStorage persistence
  - Test case list, create, and edit pages for web search evaluation
  - Routes integrated in App.jsx for web search test management
affects: [06-02-web-search-execution, 07-comparison-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - localStorage persistence for web search test cases under key 'web-search-eval:test-cases'
    - CRUD operations via custom hook pattern (useWebSearchTests)
    - Nested routes under /web-search/test-cases

key-files:
  created:
    - frontend/src/hooks/useWebSearchTests.js
    - frontend/src/pages/web-search/TestCaseList.jsx
    - frontend/src/pages/web-search/TestCaseCreate.jsx
    - frontend/src/pages/web-search/TestCaseEdit.jsx
  modified:
    - frontend/src/App.jsx

key-decisions:
  - "useWebSearchTests hook uses useStickyState for automatic localStorage persistence"
  - "Test cases stored with id (UUID), name, year (4-digit), lineup (string array)"
  - "No backend integration yet - localStorage only (Phase 7 adds execution)"

patterns-established:
  - "Web search test case CRUD pattern mirrors image eval test case pattern"
  - "Year validation requires 4-digit number via regex /^\d{4}$/"
  - "Tests sorted by year descending (most recent first) in list view"

# Metrics
duration: 4min
completed: 2026-01-26
---

# Phase 6 Plan 1: Web Search Test CRUD Summary

**Web search test case CRUD with localStorage persistence - create, edit, delete, and list test cases with festival name, year, and ground truth lineup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-26T20:01:21Z
- **Completed:** 2026-01-26T20:04:57Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- useWebSearchTests hook provides full CRUD operations with localStorage persistence
- Test case create and edit forms with validation (name required, year must be 4-digit, at least one artist)
- Test case list sorted by year with delete confirmation
- Routes integrated in App.jsx - web search eval tab now functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Create hook and list component** - `8013780` (feat)
2. **Task 2: Create form and edit form** - `35cd318` (feat)
3. **Task 3: Wire routes in App.jsx** - `25164c2` (feat)

## Files Created/Modified
- `frontend/src/hooks/useWebSearchTests.js` - Custom hook for CRUD operations with localStorage persistence
- `frontend/src/pages/web-search/TestCaseList.jsx` - List view with create/delete actions, sorted by year
- `frontend/src/pages/web-search/TestCaseCreate.jsx` - Create form with validation and import buttons
- `frontend/src/pages/web-search/TestCaseEdit.jsx` - Edit form with pre-filled data and validation
- `frontend/src/App.jsx` - Added web search test case routes to web-search-eval tabpanel

## Decisions Made
- Used crypto.randomUUID() for ID generation (client-side, sufficient for localStorage-only implementation)
- Functional updates in hook (setTests(prev => ...)) to avoid stale state issues
- Import buttons support both file upload (.txt) and clipboard paste
- Year field limited to 4 characters with maxLength attribute for better UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Web search test case management complete
- Ready for Phase 6 Plan 2: Web search execution implementation
- Test data structure supports execution (id, name, year, lineup array)

---
*Phase: 06-test-management*
*Completed: 2026-01-26*
