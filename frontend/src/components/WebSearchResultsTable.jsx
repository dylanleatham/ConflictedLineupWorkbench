import WebSearchResultRow from './WebSearchResultRow'

/**
 * WebSearchResultsTable Component
 *
 * Displays batch results with summary stats and export button.
 * Shows perfect count and average accuracy per CONTEXT.md.
 */
function WebSearchResultsTable({ results, tests, onExport }) {
  if (!results || !results.results || results.results.length === 0) {
    return null
  }

  // Build test name lookup
  const testNameMap = {}
  tests.forEach(t => {
    testNameMap[t.id] = `${t.name} ${t.year}`
  })

  // Calculate summary
  const successResults = results.results.filter(r => r.status === 'success' && r.accuracy)
  const perfectCount = successResults.filter(r => r.accuracy.accuracy_percentage === 100).length
  const avgAccuracy = successResults.length > 0
    ? successResults.reduce((sum, r) => sum + r.accuracy.accuracy_percentage, 0) / successResults.length
    : 0

  return (
    <div style={styles.container}>
      {/* Header with title and export */}
      <div style={styles.header}>
        <h2 style={styles.title}>Results</h2>
        <button onClick={onExport} style={styles.exportButton}>
          Export JSON
        </button>
      </div>

      {/* Summary stats */}
      <div style={styles.summary}>
        <div style={styles.statBox}>
          <span style={styles.statValue}>{results.results.length}</span>
          <span style={styles.statLabel}>Total Tests</span>
        </div>
        <div style={styles.statBox}>
          <span style={{ ...styles.statValue, color: '#28a745' }}>{perfectCount}</span>
          <span style={styles.statLabel}>Perfect (100%)</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statValue}>{avgAccuracy.toFixed(1)}%</span>
          <span style={styles.statLabel}>Average Accuracy</span>
        </div>
        <div style={styles.statBox}>
          <span style={{ ...styles.statValue, color: '#dc3545' }}>
            {results.results.filter(r => r.status === 'failed').length}
          </span>
          <span style={styles.statLabel}>Failed</span>
        </div>
      </div>

      {/* Results table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.iconHeader}>Status</th>
              <th style={styles.headerCell}>Test</th>
              <th style={styles.headerCell}>Accuracy</th>
              <th style={styles.countHeader}>Matched</th>
              <th style={styles.countHeader}>Missed</th>
              <th style={styles.countHeader}>Extra</th>
              <th style={styles.iconHeader}></th>
            </tr>
          </thead>
          <tbody>
            {results.results.map((result) => (
              <WebSearchResultRow
                key={result.test_id}
                result={result}
                testName={testNameMap[result.test_id] || result.test_id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginTop: '30px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#333',
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  summary: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  statBox: {
    flex: 1,
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  tableContainer: {
    borderRadius: '8px',
    border: '1px solid #ddd',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #ddd',
  },
  headerCell: {
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    color: '#555',
  },
  iconHeader: {
    padding: '12px 8px',
    textAlign: 'center',
    width: '50px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#555',
  },
  countHeader: {
    padding: '12px 8px',
    textAlign: 'center',
    width: '80px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#555',
  },
}

export default WebSearchResultsTable
