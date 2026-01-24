# Phase 3: Execution & Evaluation - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Run Claude API calls against test cases and measure extraction accuracy. Users can execute individual tests or batch runs, see progress, and get accuracy scores comparing extracted lineups against ground truth. Result visualization and export are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Execution flow
- Both individual and batch execution supported
- Individual: Run button on test case detail page
- Batch: "Run All" button runs against all test cases
- Two test modes: text-based (festival name) and image-based (festival image)
- Batch progress shown as progress bar with counter ("3/10 complete")
- Cancel button available during batch execution, keeps partial results

### API integration
- Claude API key from environment variable only (ANTHROPIC_API_KEY on backend)
- No UI input for API key - never exposed to frontend
- Rate limiting: No artificial delay, exponential backoff on 429 responses
- On API error/timeout in batch: skip and continue to next test, mark failed test
- Fixed timeout for individual API calls (Claude decides reasonable default)

### Accuracy calculation
- Display format: fraction + percentage ("17/20 artists (85%)")
- Detailed breakdown showing: matched artists, missed (in ground truth but not extracted), extra (extracted but not in ground truth)
- String matching: case-insensitive comparison
- Batch summary stats: total tests run, count of perfect scores (100%), average accuracy

### Result storage
- Claude's discretion on persistence vs memory-only
- No history of multiple runs - only latest result matters
- Include run metadata: model used, system prompt used, timestamp
- Batch summary displayed in modal overlay, stay on current page

### Claude's Discretion
- Whether to persist results to backend or keep in memory only
- Exact timeout duration for API calls
- Progress bar styling and animation
- Error message formatting for failed tests

</decisions>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-execution-evaluation*
*Context gathered: 2026-01-23*
