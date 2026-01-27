import { useState } from 'react'

/**
 * WebSearchResultRow Component
 *
 * Expandable row showing test result with inline diff.
 * Colors per CONTEXT.md: green=correct, red=missing, yellow=extra
 */
function WebSearchResultRow({ result, testName }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isSuccess = result.status === 'success'
  const accuracy = result.accuracy
  const isPerfect = accuracy?.accuracy_percentage === 100

  // Color coding per CONTEXT.md
  const getPercentageColor = (pct) => {
    if (pct === 100) return '#28a745' // Green - pass
    if (pct >= 80) return '#ffc107'   // Yellow - close
    return '#dc3545'                   // Red - poor
  }

  return (
    <>
      <tr
        style={{
          ...styles.row,
          cursor: 'pointer',
          backgroundColor: isExpanded ? '#f8f9fa' : 'white'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status icon */}
        <td style={styles.iconCell}>
          {!isSuccess ? (
            <span style={{ color: '#dc3545' }}>X</span>
          ) : isPerfect ? (
            <span style={{ color: '#28a745' }}>Y</span>
          ) : (
            <span style={{ color: '#ffc107' }}>o</span>
          )}
        </td>

        {/* Test name */}
        <td style={styles.cell}>{testName}</td>

        {/* Accuracy percentage */}
        <td style={styles.cell}>
          {isSuccess && accuracy ? (
            <span style={{ color: getPercentageColor(accuracy.accuracy_percentage), fontWeight: '600' }}>
              {accuracy.accuracy_percentage}% match
            </span>
          ) : (
            <span style={{ color: '#dc3545' }}>Error</span>
          )}
        </td>

        {/* Matched/Missed/Extra counts */}
        <td style={styles.countCell}>
          {isSuccess && accuracy ? accuracy.matched : '-'}
        </td>
        <td style={styles.countCell}>
          {isSuccess && accuracy ? accuracy.missed.length : '-'}
        </td>
        <td style={styles.countCell}>
          {isSuccess && accuracy ? accuracy.extra.length : '-'}
        </td>

        {/* Expand icon */}
        <td style={styles.iconCell}>
          {isExpanded ? 'v' : '>'}
        </td>
      </tr>

      {/* Expanded content - inline diff */}
      {isExpanded && (
        <tr>
          <td colSpan={7} style={styles.expandedCell}>
            {isSuccess && accuracy ? (
              <div style={styles.diffContainer}>
                <h4 style={styles.diffTitle}>Lineup Comparison</h4>
                <ul style={styles.diffList}>
                  {/* Matched artists - green */}
                  {accuracy.matched_artists.map((artist, i) => (
                    <li key={`matched-${i}`} style={{ ...styles.diffItem, color: '#28a745' }}>
                      [Y] {artist}
                    </li>
                  ))}
                  {/* Missing artists - red */}
                  {accuracy.missed.map((artist, i) => (
                    <li key={`missed-${i}`} style={{ ...styles.diffItem, color: '#dc3545' }}>
                      [X] {artist} (missing)
                    </li>
                  ))}
                  {/* Extra artists - yellow */}
                  {accuracy.extra.map((artist, i) => (
                    <li key={`extra-${i}`} style={{ ...styles.diffItem, color: '#b8860b' }}>
                      [+] {artist} (extra)
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={styles.errorBox}>
                <strong>Error:</strong> {result.error || 'Unknown error'}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

const styles = {
  row: {
    borderBottom: '1px solid #e0e0e0',
  },
  cell: {
    padding: '12px 8px',
  },
  iconCell: {
    padding: '12px 8px',
    textAlign: 'center',
    width: '50px',
  },
  countCell: {
    padding: '12px 8px',
    textAlign: 'center',
    width: '80px',
  },
  expandedCell: {
    padding: '0',
    backgroundColor: '#f8f9fa',
  },
  diffContainer: {
    padding: '16px 24px',
  },
  diffTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  diffList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    columnCount: 3,
    columnGap: '24px',
  },
  diffItem: {
    padding: '4px 0',
    fontSize: '13px',
    breakInside: 'avoid',
  },
  errorBox: {
    padding: '16px 24px',
    backgroundColor: '#fff5f5',
    color: '#dc3545',
  },
}

export default WebSearchResultRow
