# Phase 7: Execution and Results - Research

**Researched:** 2026-01-26
**Domain:** Test execution with Claude API web search, results display, and export
**Confidence:** HIGH

## Summary

This phase implements execution of web search tests against Claude's API with web search tools enabled, displaying results with metrics, and exporting results as JSON. The existing codebase already has mature patterns for test execution, batch processing, progress tracking, and results display from the v1.0 workbench that can be directly reused.

The key technical requirements are:
1. Calling Claude API with web search tool (`type: "web_search_20250305"`)
2. Sequential batch execution with polling-based progress updates
3. Cancellation via flag-based approach (existing pattern)
4. Results comparison with strict string matching (100% = pass)
5. Aggregate metrics calculation and inline diff display
6. Client-side JSON export via Blob API

**Primary recommendation:** Reuse the existing execution/batch/results patterns from v1.0, adapting them for the web search test structure (festival name + year instead of image/text mode). The backend already has web search enabled in `claude.py`.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | existing | Backend API endpoints | Already used, BackgroundTasks for batch |
| anthropic (Python) | existing | Claude API calls | Already has web search configured |
| React | existing | Frontend UI | Existing component patterns |

### Supporting (Already in Codebase)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| AsyncAnthropic | Async Claude calls | Single/batch execution |
| FastAPI BackgroundTasks | Async batch processing | Batch execution |
| Blob API (native) | Client-side JSON export | Export results |

### No New Dependencies Needed
The existing stack is complete. All required functionality is available in:
- Existing API patterns (`/api/executions`)
- Existing hooks (`useExecution`, `useBatchExecution`)
- Existing components (`ExecutionResult`, `BatchProgress`, `ResultsTable`)

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── api/
│   └── webSearchExecutions.js   # API calls for web search execution
├── hooks/
│   └── useWebSearchExecution.js # Hook for single execution
│   └── useWebSearchBatch.js     # Hook for batch execution
├── components/
│   └── WebSearchExecutionResult.jsx  # Single result display
│   └── WebSearchBatchProgress.jsx    # Progress bar with count
│   └── WebSearchResultsTable.jsx     # Results with inline diff
├── pages/web-search/
│   └── ExecutionPage.jsx        # Main execution UI
│   └── ResultsPage.jsx          # Results view with export
└── utils/
    └── webSearchExport.js       # JSON export for web search results

backend/
├── api/
│   └── web_search_executions.py # New endpoints for web search tests
└── services/
    └── web_search.py            # Web search specific execution logic
```

### Pattern 1: Single Test Execution (from existing useExecution)
**What:** Execute one test, show inline spinner, display result in place
**When to use:** User clicks "Run" button on individual test
**Example:**
```javascript
// Source: existing frontend/src/hooks/useExecution.js pattern
const { execute, isExecuting, result, error } = useWebSearchExecution()

const handleRun = async (testId) => {
  await execute(testId, {
    system_prompt: config.systemPrompt,
    model: config.claudeModel
  })
}
```

### Pattern 2: Batch Execution with Polling (from existing useBatchExecution)
**What:** Sequential execution with progress polling every 1 second
**When to use:** User runs all tests
**Example:**
```javascript
// Source: existing frontend/src/hooks/useBatchExecution.js pattern
const { start, cancel, progress, results, isRunning } = useWebSearchBatch()

// Start batch
await start(testIds, { system_prompt, model })

// Progress polling happens automatically via useEffect
// Format: "Running 3/10..."
```

### Pattern 3: Cancellation via Flag (from existing backend)
**What:** Set cancelled flag, stop after current test, keep partial results
**When to use:** User cancels running batch
**Example:**
```python
# Source: existing backend/api/executions.py pattern
@dataclass
class BatchState:
    cancelled: bool = False
    results: List[ExecutionResult] = field(default_factory=list)

# In execution loop:
for test_id in test_ids:
    if state.cancelled:
        break  # Remaining tests skipped, completed results preserved
```

### Pattern 4: Inline Diff Display (per CONTEXT.md decisions)
**What:** Single list with additions/missing highlighted
**When to use:** Showing expected vs actual comparison
**Example:**
```jsx
// Colors per CONTEXT.md: green=correct, red=missing, yellow=extra
<ul>
  {matchedArtists.map(a => <li style={{color: '#28a745'}}>{a}</li>)}
  {missedArtists.map(a => <li style={{color: '#dc3545'}}>{a}</li>)}
  {extraArtists.map(a => <li style={{color: '#ffc107'}}>{a}</li>)}
</ul>
```

### Anti-Patterns to Avoid
- **Parallel batch execution:** Decided in CONTEXT.md - tests run sequentially, one at a time
- **WebSocket for progress:** Polling is simpler and already proven in codebase
- **Complex cancellation:** Flag-based approach is sufficient, no need for task managers

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accuracy calculation | Custom comparison | `evaluator.calculate_accuracy()` | Handles case-insensitive matching, set operations |
| JSON export | Custom file handling | `downloadJSON()` from utils/export.js | Handles Blob creation, URL revocation |
| Batch progress polling | Manual setInterval | `useBatchExecution` pattern | Handles cleanup, stale state, polling lifecycle |
| Claude API calls | Raw fetch | `AsyncAnthropic` client | Handles retries, rate limiting, timeouts |
| Progress percentage | Manual calculation | Existing formula `(completed + failed) / total * 100` | Consistent with v1.0 |

**Key insight:** The v1.0 workbench solved all these problems. Reuse those solutions rather than reimplementing.

## Common Pitfalls

### Pitfall 1: Stale State in Polling Callbacks
**What goes wrong:** Progress updates reference stale state from closure
**Why it happens:** setInterval captures state at creation time
**How to avoid:** Use useRef for mutable references (existing pattern in useBatchExecution)
**Warning signs:** Progress counter jumps or resets unexpectedly

### Pitfall 2: Memory Leak on Unmount During Batch
**What goes wrong:** Polling continues after component unmounts
**Why it happens:** useEffect cleanup doesn't run if batch is in progress
**How to avoid:** Track mounted state with ref, clear intervals in cleanup (existing pattern)
**Warning signs:** Console warnings about setting state on unmounted component

### Pitfall 3: Web Search Rate Limits
**What goes wrong:** API returns rate limit errors during batch execution
**Why it happens:** Too many searches in quick succession
**How to avoid:** Sequential execution with reasonable delays; handle rate limit errors gracefully
**Warning signs:** Multiple "too_many_requests" errors in results

### Pitfall 4: Export Blob Not Revoked
**What goes wrong:** Memory leak from unreleased object URLs
**Why it happens:** Forgetting URL.revokeObjectURL() after download
**How to avoid:** Always revoke after triggering download (existing pattern in export.js)
**Warning signs:** Memory usage increases with each export

### Pitfall 5: Cancelled Tests Showing as Failed
**What goes wrong:** Tests after cancellation appear with error status
**Why it happens:** Not distinguishing between "skipped" and "failed"
**How to avoid:** Mark remaining tests as "skipped" status, not "failed"
**Warning signs:** High failure count after cancellation

## Code Examples

Verified patterns from official sources and existing codebase:

### Claude API Web Search Call
```python
# Source: existing backend/services/claude.py + Anthropic docs
response = await asyncio.wait_for(
    client.messages.create(
        model=model,
        max_tokens=4096,
        system=system_prompt,
        tools=[
            {
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 5  # Optional: limit searches per request
            }
        ],
        messages=[
            {
                "role": "user",
                "content": f"Festival: {festival_name} {year}"
            }
        ]
    ),
    timeout=timeout
)
```

### Batch Progress Display
```jsx
// Source: existing frontend/src/components/BatchProgress.jsx
<div style={styles.header}>
  <span>Running {completed + failed}/{total}...</span>
  {!cancelled && <button onClick={onCancel}>Cancel</button>}
</div>
<div style={styles.progressBar}>
  <div style={{ width: `${percentage}%` }} />
</div>
```

### Match Percentage with Color Coding
```jsx
// Per CONTEXT.md: Show percentage, color-coded, Pass = 100% only
const getPercentageColor = (percentage) => {
  if (percentage === 100) return '#28a745'  // Green - pass
  if (percentage >= 80) return '#ffc107'    // Yellow - close
  return '#dc3545'                           // Red - poor
}

<span style={{ color: getPercentageColor(accuracy.accuracy_percentage) }}>
  {accuracy.accuracy_percentage}% match
</span>
```

### JSON Export
```javascript
// Source: existing frontend/src/utils/export.js
export function exportWebSearchResults(results, config) {
  const exportData = {
    exported_at: new Date().toISOString(),
    config: { model: config.model, system_prompt: config.system_prompt },
    summary: {
      total: results.length,
      passed: results.filter(r => r.accuracy?.accuracy_percentage === 100).length,
      average_accuracy: calculateAverage(results)
    },
    results
  }

  const filename = `web-search-results-${Date.now()}.json`
  downloadJSON(exportData, filename)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling every 500ms | Polling every 1000ms | Existing pattern | Reduced server load |
| Complex task queues | FastAPI BackgroundTasks | N/A - already simple | Simpler deployment |
| Server-side export | Client-side Blob export | N/A - already client | No server storage needed |

**Deprecated/outdated:**
- Nothing deprecated - existing patterns are current best practices

## Open Questions

Things that couldn't be fully resolved:

1. **Web Search Rate Limit Thresholds**
   - What we know: Claude API has rate limits, $10 per 1,000 searches
   - What's unclear: Exact rate limit thresholds per minute/hour for batch execution
   - Recommendation: Implement graceful retry with exponential backoff; display rate limit errors clearly in results

2. **Optimal max_uses Setting**
   - What we know: `max_uses` parameter limits searches per request
   - What's unclear: Best value for lineup extraction (1 search may be enough)
   - Recommendation: Start with `max_uses: 5` (default), can tune later

3. **Results Persistence**
   - What we know: CONTEXT.md doesn't specify persistent storage for results
   - What's unclear: Should results persist across browser sessions?
   - Recommendation: Keep results in React state for now (same as v1.0); add localStorage if requested

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: `backend/api/executions.py`, `backend/services/claude.py`
- Existing frontend hooks: `useExecution.js`, `useBatchExecution.js`
- Existing components: `ExecutionResult.jsx`, `BatchProgress.jsx`, `ResultsTable.jsx`
- Anthropic official docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool

### Secondary (MEDIUM confidence)
- React polling patterns: Multiple sources confirm useEffect + setInterval + cleanup pattern
- Blob API for export: MDN documentation + existing `export.js` implementation

### Tertiary (LOW confidence)
- None - all findings verified with official docs or existing code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - reusing existing proven patterns
- Architecture: HIGH - following established codebase conventions
- Pitfalls: HIGH - learned from existing code and documented API behaviors

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - patterns are stable)
