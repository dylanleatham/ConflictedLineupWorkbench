# Phase 4: Results & Export - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Display test results in a structured table showing expected vs actual lineups, with pass/fail status at a glance, and export capability to JSON for external analysis. This phase focuses on viewing and exporting results — test execution was completed in Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Results table layout
- Diff view showing three sections: Matched artists, Missed artists, Extra artists (each in own block)
- Main table shows counts only ("5 matched, 2 missed, 1 extra") — click to see artist names
- Standard columns: Test name, Matched/Missed/Extra counts, Accuracy %, Pass/Fail status
- Clicking a row expands to show full artist breakdown with three-section diff view

### Pass/fail criteria
- Pass = 100% accuracy only (all expected artists matched AND no extra artists)
- Display with icon + color: green checkmark for pass, red X for fail
- Separate "Error" status (yellow/gray icon) for tests that failed to run (API error, timeout)
- Prominent summary stat at top: "7/10 tests passed (70%)"

### Export format & scope
- Batch results only (no individual test export)
- JSON format only (handles nested artist lists well)
- Include: results + config (model and system prompt used)
- Export button in results view triggers file download

### Results access point
- Dedicated results page at /results route
- Auto-navigate to results page after batch completes
- Results link in navigation (shows last batch if exists)
- Empty state with CTA: "No results yet. Run a batch to see results here." with button to list

### Claude's Discretion
- Exact styling of three-section diff view
- Animation/transition when expanding rows
- File naming convention for JSON export
- Exact empty state illustration/copy

</decisions>

<specifics>
## Specific Ideas

- Reuse color-coding from Phase 3: green (matched), red (missed), orange (extra)
- Summary stat should be prominent enough to see at a glance whether the batch was good or bad
- Perfect scores (100% pass rate) could get celebratory styling like individual 100% tests

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-results-export*
*Context gathered: 2026-01-23*
