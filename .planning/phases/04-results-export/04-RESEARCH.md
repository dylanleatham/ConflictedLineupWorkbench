# Phase 4: Results & Export - Research

**Researched:** 2026-01-23
**Domain:** Data export (CSV/JSON) and results display in React/FastAPI stack
**Confidence:** HIGH

## Summary

Phase 4 focuses on enabling users to view test results in a table format and export data as CSV or JSON for external analysis. The research reveals that this phase leverages existing result components from Phase 3 (ExecutionResult, BatchResultsModal) while adding export capabilities.

The standard approach uses **client-side export** (JavaScript Blob + URL.createObjectURL) for simple CSV/JSON downloads without server round-trips, since all result data is already available in the browser. For server-side exports when needed, FastAPI's **StreamingResponse** with pandas provides efficient in-memory generation. The key technical challenge is **CSV injection prevention** - user-controlled data (festival names, artist names) must be sanitized before export.

The existing ExecutionResult component already displays expected vs actual lineups with color-coded match/miss/extra breakdown, satisfying RSLT-01 and RSLT-02. Phase 4 primarily adds export functionality (RSLT-03) and potentially a unified results table view for comparing multiple test results.

**Primary recommendation:** Use client-side CSV/JSON export with Blob API for immediate downloads, implement CSV injection sanitization (prefix dangerous characters with single quote), and create a results comparison table component that reuses existing ExecutionResult display patterns.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pandas | 2.3+ | CSV/JSON generation (if server-side) | Industry standard for tabular data manipulation in Python, built-in to_csv/to_json methods |
| Built-in CSV module | Python stdlib | CSV sanitization and generation | Zero dependencies, sufficient for simple CSV generation with proper quoting |
| Blob API | Browser native | Client-side file creation | Native browser API, no library needed, works across modern browsers |
| URL.createObjectURL | Browser native | Download trigger | Standard browser API for creating downloadable file URLs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-csv | 2.2+ | React CSV export components | If you prefer declarative JSX approach (CSVLink component), but not needed for this simple use case |
| papaparse | 5.4+ | CSV parsing/generation | If complex CSV features needed (streaming, web workers), overkill for this phase |
| FastAPI StreamingResponse | Built-in | Server-side streaming downloads | When generating large files or need server-side processing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side export | Server-side export endpoint | Server-side adds unnecessary latency and server load when data is already in browser |
| pandas | Python csv module | csv module is lighter but pandas provides cleaner API for structured data |
| Blob + createObjectURL | FileSaver.js library | FileSaver.js adds 4KB dependency for functionality already in browsers |

**Installation:**

```bash
# Backend (only if server-side export needed)
pip install pandas>=2.3.0

# Frontend (no installation needed - using native APIs)
# Optional: npm install react-csv  # Only if using declarative approach
```

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
├── components/
│   ├── ResultsTable.jsx         # New: comparison table for multiple results
│   ├── ExportButtons.jsx        # New: CSV/JSON export buttons
│   ├── ExecutionResult.jsx      # Existing: single result display (reuse)
│   └── BatchResultsModal.jsx    # Existing: batch summary (enhance with export)
├── utils/
│   └── export.js                # New: CSV/JSON export utilities
└── pages/
    └── ResultsComparison.jsx    # New: optional dedicated results page

backend/
├── api/
│   └── exports.py               # Optional: server-side export endpoints
└── services/
    └── export_service.py        # Optional: CSV sanitization service
```

### Pattern 1: Client-Side CSV Export with Blob API

**What:** Generate CSV in browser, trigger download without server round-trip

**When to use:** When result data is already loaded in browser (our case)

**Example:**

```javascript
// frontend/src/utils/export.js

/**
 * Sanitize cell value to prevent CSV injection
 * @param {string} value - Cell value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeCSVCell(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Check if starts with dangerous character
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => value.startsWith(char))) {
    // Prefix with single quote to treat as literal text
    return `'${value}`;
  }

  return value;
}

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of result objects
 * @param {Array} headers - Column headers
 * @returns {string} CSV string
 */
function arrayToCSV(data, headers) {
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(h => sanitizeCSVCell(h)).join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      const sanitized = sanitizeCSVCell(String(value));
      // Escape quotes and wrap in quotes if contains comma/newline
      return /[,\n"]/.test(sanitized)
        ? `"${sanitized.replace(/"/g, '""')}"`
        : sanitized;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Download CSV file in browser
 * @param {string} csvContent - CSV string
 * @param {string} filename - Download filename
 */
export function downloadCSV(csvContent, filename = 'results.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export results to CSV
 * @param {Array} results - Array of test results
 */
export function exportResultsAsCSV(results) {
  const data = results.map(r => ({
    'Test ID': r.test_id,
    'Status': r.status,
    'Matched': r.accuracy?.matched || 0,
    'Total': r.accuracy?.total_ground_truth || 0,
    'Accuracy %': r.accuracy?.accuracy_percentage || 0,
    'Missed Artists': r.accuracy?.missed?.join('; ') || '',
    'Extra Artists': r.accuracy?.extra?.join('; ') || '',
    'Model': r.metadata?.model || '',
    'Timestamp': r.metadata?.timestamp || ''
  }));

  const headers = Object.keys(data[0]);
  const csv = arrayToCSV(data, headers);
  downloadCSV(csv, `test-results-${Date.now()}.csv`);
}
```

### Pattern 2: Client-Side JSON Export

**What:** Serialize results to JSON and trigger download

**When to use:** When users need machine-readable structured data

**Example:**

```javascript
// frontend/src/utils/export.js

/**
 * Download JSON file in browser
 * @param {Object} data - Data to export
 * @param {string} filename - Download filename
 */
export function downloadJSON(data, filename = 'results.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export results to JSON
 * @param {Array} results - Array of test results
 */
export function exportResultsAsJSON(results) {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_tests: results.length,
    results: results
  };

  downloadJSON(exportData, `test-results-${Date.now()}.json`);
}
```

### Pattern 3: Server-Side Export Endpoint (Optional)

**What:** Generate CSV/JSON on server using pandas

**When to use:** If we need to export from batch state that's not in browser, or need server-side processing

**Example:**

```python
# backend/api/exports.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
import pandas as pd
from typing import List
from .executions import batch_states, ExecutionResult

router = APIRouter(prefix="/api/exports", tags=["exports"])

def sanitize_csv_cell(value: str) -> str:
    """Prevent CSV injection by prefixing dangerous characters."""
    if not isinstance(value, str):
        return value

    dangerous_chars = ['=', '+', '-', '@', '\t', '\r']
    if any(value.startswith(char) for char in dangerous_chars):
        return f"'{value}"
    return value

@router.get("/batch/{batch_id}/csv")
async def export_batch_csv(batch_id: str):
    """Export batch results as CSV file."""
    state = batch_states.get(batch_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found")

    # Convert results to DataFrame
    data = []
    for result in state.results:
        row = {
            'test_id': result.test_id,
            'status': result.status,
            'matched': result.accuracy.matched if result.accuracy else 0,
            'total': result.accuracy.total_ground_truth if result.accuracy else 0,
            'accuracy_%': result.accuracy.accuracy_percentage if result.accuracy else 0,
            'missed_artists': '; '.join(result.accuracy.missed) if result.accuracy else '',
            'extra_artists': '; '.join(result.accuracy.extra) if result.accuracy else '',
            'model': result.metadata.get('model', ''),
            'timestamp': result.metadata.get('timestamp', '')
        }
        # Sanitize string fields
        for key in ['test_id', 'missed_artists', 'extra_artists', 'model']:
            if key in row:
                row[key] = sanitize_csv_cell(row[key])
        data.append(row)

    df = pd.DataFrame(data)

    # Generate CSV in memory
    stream = io.StringIO()
    df.to_csv(stream, index=False, quoting=1)  # QUOTE_ALL
    stream.seek(0)

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=batch-{batch_id}.csv"}
    )

@router.get("/batch/{batch_id}/json")
async def export_batch_json(batch_id: str):
    """Export batch results as JSON file."""
    state = batch_states.get(batch_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found")

    # Convert results to dict format
    data = []
    for result in state.results:
        data.append(result.model_dump())

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "batch_id": batch_id,
        "total_tests": state.total,
        "results": data
    }

    # Generate JSON in memory
    json_str = json.dumps(export_data, indent=2)
    stream = io.BytesIO(json_str.encode())

    return StreamingResponse(
        stream,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=batch-{batch_id}.json"}
    )
```

### Pattern 4: Results Comparison Table Component

**What:** Display multiple test results in table format for comparison

**When to use:** For RSLT-01 (view results table) and RSLT-02 (pass/fail at a glance)

**Example:**

```jsx
// frontend/src/components/ResultsTable.jsx
function ResultsTable({ results, onExportCSV, onExportJSON }) {
  if (!results || results.length === 0) {
    return <div>No results to display</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Test Results</h2>
        <div style={styles.exportButtons}>
          <button onClick={onExportCSV} style={styles.exportBtn}>
            Export CSV
          </button>
          <button onClick={onExportJSON} style={styles.exportBtn}>
            Export JSON
          </button>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Status</th>
            <th>Accuracy</th>
            <th>Matched</th>
            <th>Missed</th>
            <th>Extra</th>
            <th>Model</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => {
            const isPerfect = result.accuracy?.accuracy_percentage === 100;
            const hasFailed = result.status === 'failed';

            return (
              <tr key={idx} style={{
                ...styles.row,
                ...(isPerfect ? styles.perfectRow : {}),
                ...(hasFailed ? styles.failedRow : {})
              }}>
                <td>{result.test_id}</td>
                <td>
                  <span style={{
                    ...styles.statusBadge,
                    ...(result.status === 'success' ? styles.successBadge : styles.failBadge)
                  }}>
                    {result.status}
                  </span>
                </td>
                <td style={styles.accuracyCell}>
                  {result.accuracy ? `${result.accuracy.accuracy_percentage}%` : 'N/A'}
                </td>
                <td style={styles.matchedCell}>
                  {result.accuracy ? `${result.accuracy.matched}/${result.accuracy.total_ground_truth}` : 'N/A'}
                </td>
                <td style={styles.missedCell}>
                  {result.accuracy?.missed?.join(', ') || '-'}
                </td>
                <td style={styles.extraCell}>
                  {result.accuracy?.extra?.join(', ') || '-'}
                </td>
                <td>{result.metadata?.model || 'N/A'}</td>
                <td>{result.metadata?.timestamp ? new Date(result.metadata.timestamp).toLocaleString() : 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    margin: '20px 0',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  exportButtons: {
    display: 'flex',
    gap: '10px'
  },
  exportBtn: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  row: {
    borderBottom: '1px solid #eee'
  },
  perfectRow: {
    backgroundColor: '#f0fff4'
  },
  failedRow: {
    backgroundColor: '#fee'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  successBadge: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  failBadge: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  accuracyCell: {
    fontWeight: 'bold',
    textAlign: 'center'
  },
  matchedCell: {
    color: '#155724'
  },
  missedCell: {
    color: '#721c24'
  },
  extraCell: {
    color: '#856404'
  }
};

export default ResultsTable;
```

### Anti-Patterns to Avoid

- **Don't create temporary files on server for downloads** - Use in-memory streams (StringIO/BytesIO) to avoid disk I/O overhead and cleanup complexity
- **Don't skip CSV injection sanitization** - Always sanitize user-controlled data before CSV export, even if it seems safe
- **Don't use JSON.parse(localStorage.getItem()) for large result sets** - localStorage has 5-10MB limits; keep exports transient or use IndexedDB
- **Don't forget URL.revokeObjectURL()** - Memory leaks accumulate if object URLs aren't revoked after download
- **Don't export sensitive data without validation** - In this app it's test data, but always verify what's being exported

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV escaping/quoting | Manual string replacement | Python csv module with QUOTE_ALL or pandas to_csv | CSV has complex edge cases: quote escaping, newlines in fields, delimiter handling |
| JSON serialization | String concatenation | JSON.stringify() or pandas to_json | Handles nested objects, special characters, encoding automatically |
| File download trigger | Custom iframe hacks | Blob API + URL.createObjectURL + anchor tag | Browser-native, works across browsers, automatic cleanup |
| CSV injection prevention | Ad-hoc character filtering | Standardized sanitization (prefix with quote) | Industry-standard approach, spreadsheet apps handle consistently |
| Large file streaming | Load entire file in memory | StreamingResponse with generators | Prevents OOM errors, better user experience for large exports |

**Key insight:** CSV format appears simple but has many gotchas (quote escaping, embedded newlines, delimiter in fields). Using stdlib csv module or pandas ensures RFC 4180 compliance without reinventing the wheel.

## Common Pitfalls

### Pitfall 1: CSV Injection Vulnerability

**What goes wrong:** User creates test case with festival name "=cmd|'/c calc'!A1" and exports to CSV. Victim opens CSV in Excel, which executes the formula and launches calculator.

**Why it happens:** Spreadsheet applications (Excel, LibreOffice, Google Sheets) interpret cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` as formulas. Without sanitization, user-controlled data becomes executable code.

**How to avoid:**
- Implement sanitizeCSVCell function that checks first character
- Prefix dangerous characters with single quote (industry standard)
- Apply sanitization to ALL user-controlled fields: test IDs, festival names, artist names
- Use QUOTE_ALL quoting strategy as additional layer of defense

**Warning signs:**
- User can control any field that appears in CSV export
- No sanitization function in export code
- Testing exports only with "clean" data
- Security review flags user input in exports

### Pitfall 2: Memory Leaks from Object URLs

**What goes wrong:** Each export creates a Blob URL via URL.createObjectURL(), but URLs are never revoked. After 100 exports, browser slows down or crashes.

**Why it happens:** createObjectURL() creates a DOMString representing the object in browser memory. These URLs persist until page unload or explicitly revoked, consuming memory.

**How to avoid:**
- Call URL.revokeObjectURL(url) immediately after download is triggered
- Implement cleanup in finally block to ensure revocation even if errors occur
- For repeated exports, create URL, trigger download, revoke in same function
- Consider using one-time-use pattern: create link, click, remove, revoke

**Warning signs:**
- Browser DevTools show increasing memory usage after multiple exports
- Object URLs accumulating in Network tab
- Page performance degrades after many export actions
- Browser console warnings about memory

### Pitfall 3: Incorrect CSV Escaping

**What goes wrong:** Artist name "The Beatles, Early Years" exported as `The Beatles, Early Years` instead of `"The Beatles, Early Years"`. CSV readers interpret comma as delimiter, breaking the field into two columns.

**Why it happens:** CSV format requires quoting fields that contain delimiters (comma), quotes, or newlines. Manual string building often misses these cases.

**How to avoid:**
- Use csv module's writer with QUOTE_MINIMAL (default) or QUOTE_ALL
- OR implement proper escaping: wrap in quotes if contains `,`, `"`, or `\n`
- Escape internal quotes by doubling them: `"` becomes `""`
- Test with edge cases: commas, quotes, newlines, empty strings

**Warning signs:**
- CSV opens with misaligned columns
- Artist names containing commas break into separate fields
- Quotes in names cause parsing errors
- Manual string concatenation for CSV generation

### Pitfall 4: Timezone Confusion in Timestamps

**What goes wrong:** Test executed at 3 PM EST shows as 8 PM in CSV export. User reports "timestamps are wrong" when sharing results with team in different timezone.

**Why it happens:** JavaScript Date.toISOString() returns UTC. toLocaleString() uses browser timezone. CSV exports mix timezone representations, causing confusion.

**How to avoid:**
- Choose ONE representation: ISO 8601 UTC (recommended for machine-readable exports)
- For CSV exports, use consistent format: `timestamp.toISOString()` for UTC
- OR include timezone in column header: "Timestamp (UTC)" or "Timestamp (Local)"
- For JSON, use ISO 8601: `{ "timestamp": "2026-01-23T20:30:00Z" }`
- Document timezone convention in export filename or header row

**Warning signs:**
- Timestamp bugs reported only by users in different timezones
- Confusion about "when did this test run?"
- Mixed use of toISOString(), toLocaleString(), toUTCString()
- No timezone indicator in exported data

### Pitfall 5: Export Button State Management

**What goes wrong:** User clicks "Export CSV" button, browser shows download, but button is still clickable and clicking again creates duplicate downloads.

**Why it happens:** Export operations are synchronous (generate data, create blob, trigger download) but UI doesn't indicate completion or prevent re-clicks.

**How to avoid:**
- Disable export buttons during generation (especially for large datasets)
- Show "Downloading..." state or spinner during export
- Re-enable button after download completes
- For large exports, add toast notification: "Export complete: results.csv downloaded"
- Consider debouncing export button clicks

**Warning signs:**
- Users accidentally trigger multiple downloads
- Large exports cause UI freeze with no feedback
- Export button remains in "loading" state after completion
- Duplicate files appear in Downloads folder

## Code Examples

Verified patterns from official sources:

### CSV Sanitization (Python)

```python
# Source: OWASP CSV Injection guidelines
# https://owasp.org/www-community/attacks/CSV_Injection

def sanitize_csv_cell(value: str) -> str:
    """
    Prevent CSV injection by prefixing dangerous characters.

    Based on OWASP recommendations for CSV injection prevention.
    """
    if not isinstance(value, str):
        return value

    # Characters that trigger formula execution in spreadsheet apps
    dangerous_chars = ['=', '+', '-', '@', '\t', '\r']

    if any(value.startswith(char) for char in dangerous_chars):
        # Prefix with single quote - spreadsheet apps treat as literal text
        return f"'{value}"

    return value
```

### FastAPI CSV Export with pandas

```python
# Source: FastAPI documentation - Custom Response Classes
# https://fastapi.tiangolo.com/advanced/custom-response/

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import pandas as pd
import io

@router.get("/export/csv")
async def export_csv():
    # Generate DataFrame from results
    df = pd.DataFrame([
        {'test_id': '001', 'accuracy': 95.5, 'status': 'success'},
        {'test_id': '002', 'accuracy': 100.0, 'status': 'success'}
    ])

    # Generate CSV in memory (no disk I/O)
    stream = io.StringIO()
    df.to_csv(stream, index=False, quoting=1)  # QUOTE_ALL for safety
    stream.seek(0)

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"}
    )
```

### Client-Side CSV Download

```javascript
// Source: MDN Web Docs - Blob API
// https://developer.mozilla.org/en-US/docs/Web/API/Blob

function downloadCSV(csvContent, filename) {
  // Create blob with proper MIME type and encoding
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8'
  });

  // Create object URL for blob
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup: remove link and revoke object URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Client-Side JSON Download

```javascript
// Source: Web Dev Tutor - Generating Files with Blobs
// https://www.webdevtutor.net/blog/javascript-blob-csv

function downloadJSON(data, filename) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FileSaver.js library | Native Blob API + createObjectURL | ~2018 | Zero dependencies, better browser support, smaller bundle size |
| Server-side file generation | Client-side Blob for small datasets | ~2019 | Reduced server load, instant downloads, no cleanup needed |
| Manual CSV string building | csv module or pandas | Always standard | Proper escaping, RFC 4180 compliance, edge case handling |
| Ignoring CSV injection | Mandatory sanitization | ~2020 (security awareness) | OWASP guidelines now include CSV injection prevention |
| react-csv for all exports | Native approach for simple cases | ~2021 | Lighter bundles, more control, react-csv still good for complex cases |

**Deprecated/outdated:**
- **FileSaver.js**: Still maintained but unnecessary for modern browsers (all support Blob + createObjectURL)
- **Downloading via hidden iframe**: Security risks, deprecated in favor of Blob approach
- **Server-side temporary files for exports**: Slow, requires cleanup, memory-inefficient compared to streaming

## Open Questions

Things that couldn't be fully resolved:

1. **Should we create a dedicated Results page or embed in existing pages?**
   - What we know: Phase 3 already has ExecutionResult component on test detail page and BatchResultsModal on list page
   - What's unclear: Whether user needs unified view comparing all historical results, or if current per-test/per-batch view is sufficient
   - Recommendation: Start with export buttons on existing BatchResultsModal (covers RSLT-03), evaluate need for dedicated page based on user feedback

2. **Should exports include all result metadata or be simplified?**
   - What we know: ExecutionResult includes matched/missed/extra artists, metadata (model, timestamp), system prompt
   - What's unclear: Whether CSV should include full system prompt (can be very long) or just reference ID
   - Recommendation: CSV should include test_id, status, accuracy, matched/missed/extra counts and lists, model, timestamp. Exclude full system prompt (too large for CSV). JSON can include everything.

3. **Do we need result persistence across sessions?**
   - What we know: Current batch results are in-memory only (cleared on server restart)
   - What's unclear: Whether users want to export results from previous test runs, or only current session
   - Recommendation: Phase 4 should work with current in-memory results. If users need history, that's Phase 5 (results history/persistence).

4. **Should pandas be added as dependency?**
   - What we know: Pandas adds ~30MB to deployment, but provides clean API for DataFrame operations
   - What's unclear: Whether simple csv module is sufficient, or if pandas benefits justify size
   - Recommendation: Start WITHOUT pandas (use csv module or client-side export). Add pandas only if server-side export with complex transformations is needed.

## Sources

### Primary (HIGH confidence)

- [FastAPI Custom Response Documentation](https://fastapi.tiangolo.com/advanced/custom-response/) - Official guidance on StreamingResponse and FileResponse for downloads
- [Pandas I/O Tools Documentation](https://pandas.pydata.org/docs/user_guide/io.html) - Official to_csv() and to_json() parameters and usage
- [Python CSV Module Documentation](https://docs.python.org/3/library/csv.html) - Official csv module quoting and escaping behavior
- [MDN Blob API](https://developer.mozilla.org/en-US/docs/Web/API/Blob) - Browser-native Blob API for file creation
- [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection) - Security guidelines for CSV injection prevention

### Secondary (MEDIUM confidence)

- [How to Return a CSV File in FastAPI - Sling Academy](https://www.slingacademy.com/article/how-to-return-a-csv-file-in-fastapi/) - Practical examples of FileResponse and StreamingResponse patterns
- [CoreUI: How to Download Files in JavaScript (Dec 2025)](https://coreui.io/answers/how-to-download-a-file-in-javascript/) - Recent best practices for Blob + createObjectURL
- [Best Practices for CSV Injection Prevention - Cyber Chief](https://www.cyberchief.ai/2024/09/csv-formula-injection-attacks.html) - Cross-language sanitization patterns
- [Pandas CSV Quoting Strategies](https://queirozf.com/entries/pandas-dataframes-csv-quoting-and-escaping-strategies) - Detailed quoting parameter examples

### Tertiary (LOW confidence)

- Various search results on React CSV export libraries - Ecosystem overview, not authoritative
- GeeksforGeeks tutorials - Educational but not official docs
- Medium articles on CSV/JSON export - Individual opinions, not verified best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on official documentation (FastAPI, pandas, Blob API), widely adopted patterns
- Architecture: HIGH - Client-side Blob export is proven pattern, FastAPI StreamingResponse is official recommendation
- Pitfalls: HIGH - CSV injection is documented OWASP vulnerability, memory leak patterns are well-known browser issues
- CSV sanitization: HIGH - OWASP guidelines provide clear recommendations (prefix with quote)
- pandas necessity: MEDIUM - Not strictly required, tradeoff between simplicity and bundle size

**Research date:** 2026-01-23
**Valid until:** 60 days (stable domain - CSV/JSON export patterns change slowly, but always verify latest OWASP security guidance)
