import { useState } from 'react'
import ResultsSummary from './ResultsSummary'
import ResultsRow from './ResultsRow'

/**
 * ResultsTable Component
 *
 * Full results table combining summary stats and expandable rows.
 * Structure:
 * 1. Header with title and Export JSON button
 * 2. ResultsSummary (aggregate stats)
 * 3. Table with expandable ResultsRow components
 *
 * Props:
 * - results: batch results object {total, completed, failed, perfect_count, average_accuracy, results[]}
 * - onExport: function to trigger JSON export
 */
function ResultsTable({ results, onExport }) {
  // Track which rows are expanded (Set of test IDs)
  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleRow = (testId) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(testId)) {
        next.delete(testId)
      } else {
        next.add(testId)
      }
      return next
    })
  }

  if (!results || !results.results || results.results.length === 0) {
    return (
      <div style={styles.emptyState}>
        <h3>No results yet</h3>
        <p>Run a batch test to see results here.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header with title and export button */}
      <div style={styles.header}>
        <h2 style={styles.title}>Test Results</h2>
        <button onClick={onExport} style={styles.exportButton}>
          Export JSON
        </button>
      </div>

      {/* Summary stats */}
      <ResultsSummary
        results={results.results}
        perfect_count={results.perfect_count}
        average_accuracy={results.average_accuracy}
      />

      {/* Results table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={{...styles.headerCell, ...styles.iconColumn}}>Status</th>
              <th style={styles.headerCell}>Test Name</th>
              <th style={{...styles.headerCell, ...styles.countColumn}}>Matched</th>
              <th style={{...styles.headerCell, ...styles.countColumn}}>Missed</th>
              <th style={{...styles.headerCell, ...styles.countColumn}}>Extra</th>
              <th style={{...styles.headerCell, ...styles.countColumn}}>Accuracy</th>
              <th style={{...styles.headerCell, ...styles.iconColumn}}></th>
            </tr>
          </thead>
          <tbody>
            {results.results.map((result) => (
              <ResultsRow
                key={result.test_id}
                result={result}
                isExpanded={expandedRows.has(result.test_id)}
                onToggle={() => toggleRow(result.test_id)}
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
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#333',
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #ddd',
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
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#555',
  },
  iconColumn: {
    width: '50px',
    textAlign: 'center',
  },
  countColumn: {
    width: '80px',
    textAlign: 'center',
  },
}

export default ResultsTable
