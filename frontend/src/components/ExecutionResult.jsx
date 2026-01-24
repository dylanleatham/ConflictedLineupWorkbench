/**
 * ExecutionResult Component
 *
 * Displays the results of a test execution including:
 * - Accuracy score (fraction + percentage)
 * - Matched artists (green)
 * - Missed artists (red) - in ground truth but not extracted
 * - Extra artists (orange) - extracted but not in ground truth
 * - Metadata (model used, timestamp)
 */
function ExecutionResult({ result }) {
  if (!result) return null

  // Handle failed execution
  if (result.status === 'failed') {
    return (
      <div style={styles.resultContainer}>
        <h3 style={styles.title}>Execution Result</h3>
        <div style={styles.errorBox}>
          <strong>Error:</strong> {result.error}
        </div>
      </div>
    )
  }

  const { accuracy, extracted_lineup, metadata } = result
  const isPerfect = accuracy.accuracy_percentage === 100

  return (
    <div style={{
      ...styles.resultContainer,
      ...(isPerfect ? styles.perfectContainer : {})
    }}>
      <h3 style={styles.title}>Execution Result</h3>

      {/* Accuracy display */}
      <div style={{
        ...styles.accuracyDisplay,
        ...(isPerfect ? styles.perfectAccuracy : {})
      }}>
        <span style={styles.accuracyFraction}>
          {accuracy.matched}/{accuracy.total_ground_truth} artists
        </span>
        <span style={styles.accuracyPercentage}>
          ({accuracy.accuracy_percentage.toFixed(2)}%)
        </span>
        {isPerfect && <span style={styles.perfectBadge}>Perfect!</span>}
      </div>

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

      {/* Extracted lineup (raw) */}
      {extracted_lineup && extracted_lineup.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Extracted Lineup (Raw)</h4>
          <div style={styles.rawLineup}>
            {extracted_lineup.join(', ')}
          </div>
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div style={styles.metadataSection}>
          <div style={styles.metadataItem}>
            <strong>Model:</strong> {metadata.model}
          </div>
          <div style={styles.metadataItem}>
            <strong>Timestamp:</strong> {new Date(metadata.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  resultContainer: {
    marginTop: '30px',
    padding: '20px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  perfectContainer: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '22px',
    color: '#333',
  },
  errorBox: {
    padding: '15px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
  },
  accuracyDisplay: {
    padding: '15px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  perfectAccuracy: {
    backgroundColor: '#d4edda',
  },
  accuracyFraction: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  accuracyPercentage: {
    fontSize: '20px',
    color: '#666',
  },
  perfectBadge: {
    padding: '4px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: '20px',
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
  rawLineup: {
    padding: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#666',
    fontFamily: 'monospace',
  },
  metadataSection: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #ddd',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  metadataItem: {
    fontSize: '14px',
    color: '#666',
  },
}

export default ExecutionResult
