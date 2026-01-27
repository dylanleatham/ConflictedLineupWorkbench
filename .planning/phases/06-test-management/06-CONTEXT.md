# Phase 6: Test Management - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

CRUD operations for web search test cases. Users can create, edit, and delete test cases that define a festival name, year, and expected ground truth lineup. Test cases persist between browser sessions via localStorage.

</domain>

<decisions>
## Implementation Decisions

### Test case structure
- Identified by festival name + year (e.g., "Coachella 2024")
- Ground truth entered as single text field, one artist per line (newline delimiter only)
- Minimal fields: festival name, year, ground truth lineup — no additional metadata

### Create/edit workflow
- Separate page/section for creating new test cases (not inline or modal)
- Editing uses same view as create, pre-filled with existing data
- Validation: required fields only (festival name, year, at least one artist)
- After save, return to test list showing new/updated item

### List display
- Each row shows: festival name, year, and count of artists in ground truth
- Default sort: most recent year first
- Single-item actions only (no multi-select for bulk operations)
- Empty state: simple message "No test cases yet" with prominent create button

### Delete behavior
- Claude's discretion on confirmation flow and implementation details

### Claude's Discretion
- Delete confirmation UX
- Exact layout and spacing
- Error state handling
- localStorage schema design

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-test-management*
*Context gathered: 2026-01-26*
