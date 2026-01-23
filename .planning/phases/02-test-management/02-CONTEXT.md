# Phase 2: Test Management & Configuration - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

User can manage test cases (add, edit, delete) with festival name, image, and ground truth lineup. User can configure prompt strategies by entering custom system prompts and selecting Claude models. Test execution and results display are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Test case entry flow
- Separate dedicated page for creating test cases (not modal or inline form)
- Simple file picker for image upload (no drag-drop complexity)
- Full image preview shown after file selection before saving
- After successful creation, navigate to view the newly created test case

### Ground truth input
- Multi-line text area for entering expected artists (one per line)
- Allow importing ground truth from .txt file or clipboard paste
- Display saved ground truth as bulleted list (not numbered, not inline)

### Test case list view
- Card-based layout for test cases (not table rows)
- Each card shows: image thumbnail, festival name, artist count
- Responsive grid arrangement (2-4 columns based on screen width)
- Delete action only available from detail view (not directly from list)

### Prompt configuration
- Single active system prompt (not a library of named prompts)
- Text area for editing the current system prompt in place
- Dropdown select for Claude model selection
- Configuration lives in sidebar/panel alongside test case list
- Prompt and model selection persist between sessions

### Claude's Discretion
- Input normalization for ground truth (whitespace trimming, empty line handling)
- Exact card sizing and spacing in the responsive grid
- Sidebar/panel positioning and collapse behavior
- Form validation and error message presentation
- Loading states and transitions between pages

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

*Phase: 02-test-management*
*Context gathered: 2026-01-23*
