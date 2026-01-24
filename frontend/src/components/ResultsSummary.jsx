/**
 * ResultsSummary Component
 *
 * Displays aggregate stats for a batch of test results:
 * - X/Y Tests Passed (with percentage)
 * - Perfect Scores count
 * - Average Accuracy
 * - Failed count (API errors)
 *
 * Pass criteria: 100% accuracy AND no extra artists
 */
function ResultsSummary({ results, perfect_count, average_accuracy }) {
  // Calculate pass count: 100% accuracy AND no extra artists
  const passCount = results.filter(r =>
    r.status === 'success' &&
    r.accuracy?.accuracy_percentage === 100 &&
    r.accuracy?.extra?.length === 0
  ).length

  const totalTests = results.length
  const passPercentage = totalTests > 0 ? Math.round((passCount / totalTests) * 100) : 0
  const allPassed = passCount === totalTests && totalTests > 0

  // Count failed tests (API errors, timeouts)
  const failedCount = results.filter(r => r.status === 'failed').length

  return (
    <div style={{
      ...styles.container,
      ...(allPassed ? styles.allPassedContainer : {})
    }}>
      {/* Main stat: X/Y Tests Passed */}
      <div style={{
        ...styles.mainStat,
        ...(allPassed ? styles.mainStatAllPassed : {})
      }}>
        {passCount}/{totalTests} Tests Passed ({passPercentage}%)
      </div>

      {/* Secondary stats grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Perfect Scores</div>
          <div style={styles.statValueGreen}>{perfect_count}</div>
        </div>

        <div style={styles.statItem}>
          <div style={styles.statLabel}>Average Accuracy</div>
          <div style={styles.statValueGreen}>{average_accuracy.toFixed(1)}%</div>
        </div>

        {failedCount > 0 && (
          <div style={styles.statItem}>
            <div style={styles.statLabel}>Failed (API Errors)</div>
            <div style={styles.statValueRed}>{failedCount}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  allPassedContainer: {
    backgroundColor: '#d4edda',
    border: '2px solid #28a745',
  },
  mainStat: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  mainStatAllPassed: {
    color: '#28a745',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    textAlign: 'center',
  },
  statItem: {
    padding: '10px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px',
  },
  statValueGreen: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#28a745',
  },
  statValueRed: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#dc3545',
  },
}

export default ResultsSummary
