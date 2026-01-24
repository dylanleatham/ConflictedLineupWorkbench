/**
 * ResultsRow Component
 *
 * Expandable row showing individual test result:
 * - Pass/Fail/Error icon
 * - Test name
 * - Matched/Missed/Extra counts (collapsed)
 * - Accuracy percentage
 * - Expand to see artist lists (matched, missed, extra)
 *
 * Pass criteria: 100% accuracy AND no extra artists
 * Color scheme matches ExecutionResult.jsx
 */
function ResultsRow({ result, isExpanded, onToggle }) {
  const { test_id, status, accuracy, error } = result

  // Determine status icon and styling
  let statusIcon = ''
  let statusColor = ''

  if (status === 'failed') {
    // API error, timeout, etc.
    statusIcon = '⚠'
    statusColor = '#856404'
  } else if (
    status === 'success' &&
    accuracy?.accuracy_percentage === 100 &&
    accuracy?.extra?.length === 0
  ) {
    // Pass: 100% accuracy AND no extra artists
    statusIcon = '✓'
    statusColor = '#28a745'
  } else {
    // Fail: success but didn't meet pass criteria
    statusIcon = '✗'
    statusColor = '#dc3545'
  }

  const expandIcon = isExpanded ? '▲' : '▼'

  return (
    <>
      {/* Main row (clickable) */}
      <tr onClick={onToggle} style={styles.mainRow}>
        {/* Status icon */}
        <td style={{
          ...styles.cell,
          ...styles.iconCell,
          color: statusColor
        }}>
          <span style={styles.statusIcon}>{statusIcon}</span>
        </td>

        {/* Test name */}
        <td style={styles.cell}>
          {test_id}
        </td>

        {/* Matched count */}
        <td style={{...styles.cell, ...styles.countCell}}>
          {status === 'success' ? (
            <span style={styles.matchedText}>{accuracy.matched_artists?.length || 0}</span>
          ) : (
            <span style={styles.errorText}>-</span>
          )}
        </td>

        {/* Missed count */}
        <td style={{...styles.cell, ...styles.countCell}}>
          {status === 'success' ? (
            <span style={styles.missedText}>{accuracy.missed?.length || 0}</span>
          ) : (
            <span style={styles.errorText}>-</span>
          )}
        </td>

        {/* Extra count */}
        <td style={{...styles.cell, ...styles.countCell}}>
          {status === 'success' ? (
            <span style={styles.extraText}>{accuracy.extra?.length || 0}</span>
          ) : (
            <span style={styles.errorText}>-</span>
          )}
        </td>

        {/* Accuracy */}
        <td style={{...styles.cell, ...styles.countCell}}>
          {status === 'success' ? (
            `${accuracy.accuracy_percentage.toFixed(1)}%`
          ) : (
            <span style={styles.errorText}>Error</span>
          )}
        </td>

        {/* Expand indicator */}
        <td style={{...styles.cell, ...styles.expandCell}}>
          {expandIcon}
        </td>
      </tr>

      {/* Expanded details row */}
      {isExpanded && (
        <tr>
          <td colSpan="7" style={styles.expandedCell}>
            {status === 'failed' ? (
              // Show error details
              <div style={styles.errorBox}>
                <strong>Error:</strong> {error}
              </div>
            ) : (
              // Show artist breakdown
              <div style={styles.detailsContainer}>
                {/* Matched artists */}
                {accuracy.matched_artists && accuracy.matched_artists.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>
                      <span style={styles.matchedDot}></span>
                      Matched ({accuracy.matched_artists.length})
                    </h4>
                    <ul style={styles.artistList}>
                      {accuracy.matched_artists.map((artist, index) => (
                        <li key={index} style={styles.matchedItem}>{artist}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missed artists */}
                {accuracy.missed && accuracy.missed.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>
                      <span style={styles.missedDot}></span>
                      Missed ({accuracy.missed.length})
                    </h4>
                    <ul style={styles.artistList}>
                      {accuracy.missed.map((artist, index) => (
                        <li key={index} style={styles.missedItem}>{artist}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Extra artists */}
                {accuracy.extra && accuracy.extra.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>
                      <span style={styles.extraDot}></span>
                      Extra ({accuracy.extra.length})
                    </h4>
                    <ul style={styles.artistList}>
                      {accuracy.extra.map((artist, index) => (
                        <li key={index} style={styles.extraItem}>{artist}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

const styles = {
  mainRow: {
    cursor: 'pointer',
    borderBottom: '1px solid #ddd',
    transition: 'background-color 0.2s',
  },
  cell: {
    padding: '12px 8px',
    borderBottom: '1px solid #eee',
  },
  iconCell: {
    textAlign: 'center',
    width: '50px',
  },
  statusIcon: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  countCell: {
    textAlign: 'center',
    width: '80px',
  },
  expandCell: {
    textAlign: 'center',
    width: '50px',
    color: '#666',
  },
  matchedText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  missedText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  extraText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#999',
  },
  expandedCell: {
    padding: '20px',
    backgroundColor: '#fafafa',
    borderBottom: '2px solid #ddd',
  },
  errorBox: {
    padding: '15px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
  },
  detailsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  section: {
    marginBottom: '10px',
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  matchedDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#28a745',
    display: 'inline-block',
  },
  missedDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    display: 'inline-block',
  },
  extraDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#fd7e14',
    display: 'inline-block',
  },
  artistList: {
    margin: 0,
    paddingLeft: '30px',
    listStyleType: 'disc',
  },
  matchedItem: {
    color: '#155724',
    marginBottom: '4px',
  },
  missedItem: {
    color: '#721c24',
    marginBottom: '4px',
  },
  extraItem: {
    color: '#856404',
    marginBottom: '4px',
  },
}

export default ResultsRow
