function PosterSearchResult({ result }) {
  if (!result) return null

  if (result.status === 'failed') {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Execution Result</h3>
        <div style={styles.errorBox}>
          <strong>Error:</strong> {result.error}
        </div>
        {result.claude_response && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={styles.sectionTitle}>Claude Response</h4>
            <pre style={styles.jsonBlock}>{JSON.stringify(result.claude_response, null, 2)}</pre>
          </div>
        )}
        {!result.claude_response && result.poster_url && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={styles.sectionTitle}>Returned URL</h4>
            <a href={result.poster_url} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
              {result.poster_url}
            </a>
          </div>
        )}
      </div>
    )
  }

  const { poster_url, claude_response, similarity, metadata } = result
  const simPct = similarity?.similarity_percentage ?? 0
  const simColor = simPct >= 80 ? '#28a745' : simPct >= 50 ? '#ffc107' : '#dc3545'

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Execution Result</h3>

      {similarity && (
        <div style={{ ...styles.similarityDisplay, borderLeftColor: simColor }}>
          <span style={{ ...styles.similarityValue, color: simColor }}>
            {simPct.toFixed(1)}%
          </span>
          <span style={styles.similarityLabel}>SSIM Similarity</span>
        </div>
      )}

      {claude_response && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Claude Response</h4>
          <pre style={styles.jsonBlock}>{JSON.stringify(claude_response, null, 2)}</pre>
        </div>
      )}

      {poster_url && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Poster Preview</h4>
          <a href={poster_url} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
            {poster_url}
          </a>
          <div style={styles.iframeContainer}>
            <iframe
              src={poster_url}
              title="Returned poster"
              style={styles.iframe}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

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
  container: {
    padding: '20px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
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
  similarityDisplay: {
    padding: '15px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    borderLeft: '4px solid',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  similarityValue: {
    fontSize: '28px',
    fontWeight: 'bold',
  },
  similarityLabel: {
    fontSize: '14px',
    color: '#666',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '8px',
    color: '#555',
  },
  jsonBlock: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '13px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
    maxHeight: '300px',
    overflow: 'auto',
  },
  urlLink: {
    color: '#007bff',
    wordBreak: 'break-all',
    fontSize: '14px',
  },
  iframeContainer: {
    marginTop: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '400px',
    border: 'none',
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

export default PosterSearchResult
