---
phase: 02-test-management
plan: 04
subsystem: ui
tags: [react, react-router, frontend, crud]

# Dependency graph
requires:
  - phase: 02-01
    provides: API client with CRUD operations for test cases
  - phase: 02-02
    provides: List page and navigation structure
  - phase: 02-03
    provides: ImagePreview component and useImagePreview hook
provides:
  - TestCaseDetail page with full test case display
  - TestCaseEdit page with pre-filled form
  - Delete functionality with confirmation dialog
  - Image replacement capability in edit mode
affects: [02-06, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Modal dialog overlay pattern for confirmations"
    - "Image state management (keep/remove/replace) in edit forms"
    - "Bulleted list display for lineup data"

key-files:
  created:
    - frontend/src/pages/TestCaseDetail.jsx
    - frontend/src/pages/TestCaseEdit.jsx
  modified: []

key-decisions:
  - "Delete confirmation uses modal overlay instead of browser confirm()"
  - "Edit page keeps existing image by default, requires explicit removal"
  - "Image preview in edit shows existing image OR new file, never both"
  - "Lineup displayed as bulleted list (ul/li) per CONTEXT.md requirements"

patterns-established:
  - "Delete flow: only from detail page with confirmation dialog"
  - "Edit flow: detail -> edit -> save -> detail (circular navigation)"
  - "Image management: track existingImageHash + imageFile + removeImage flag"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 02 Plan 04: Test Case Detail & Edit Summary

**Detail and edit pages with delete confirmation, image replacement, and bulleted lineup display**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T15:27:30Z
- **Completed:** 2026-01-23T15:29:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Full test case detail view with festival name, image, and lineup
- Delete functionality with modal confirmation dialog
- Edit form pre-populated with existing test case data
- Keep/remove/replace image functionality in edit mode
- Lineup displayed as bulleted list per requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TestCaseDetail page** - `6157b79` (feat)
2. **Task 2: Create TestCaseEdit page** - `0cb97e6` (feat)

**Plan metadata:** (will be created after SUMMARY)

## Files Created/Modified
- `frontend/src/pages/TestCaseDetail.jsx` - Detail view with delete action, displays full test case with image and bulleted lineup
- `frontend/src/pages/TestCaseEdit.jsx` - Edit form with pre-filled data, image replacement, and lineup import features

## Decisions Made

**1. Delete confirmation uses modal overlay**
- More professional UX than browser confirm()
- Consistent styling with rest of app
- Can be extended with additional messaging or actions

**2. Image state management in edit mode**
- Three states tracked: existingImageHash, imageFile, removeImage
- Logic: removeImage → null, imageFile → upload new, else → keep existing
- Preview shows existing OR new file based on state flags

**3. Lineup display as bulleted list**
- Per CONTEXT.md specification (not numbered, not inline)
- Uses semantic ul/li HTML elements
- Artist count shown in section heading

**4. Navigation flows**
- Delete: detail → confirmation → list (on success)
- Edit: detail → edit → detail (on save or cancel)
- Cancel in edit mode returns to detail without saving

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Test case CRUD functionality now complete. Users can:
- View all test cases (list page from 02-02)
- Create new test cases (create page from 02-03)
- View individual test cases (detail page from 02-04)
- Edit existing test cases (edit page from 02-04)
- Delete test cases (from detail page in 02-04)

Ready for test execution features in later plans (02-06 and Phase 3).

---
*Phase: 02-test-management*
*Completed: 2026-01-23*
