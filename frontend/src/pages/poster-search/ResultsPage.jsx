import { useState, useEffect } from 'react'
import { getTestCases } from '../../api/testCases'

function PosterSearchResultsPage({ batchResults }) {
  const [tests, setTests] = useState([])

  useEffect(() => {
    getTestCases().then(setTests).catch(() => {})
  }, [])

  if (!batchResults) {
    return (
      <div style={styles.emptyState}>
        <h2 style={styles.emptyTitle}>No results yet</h2>
        <p style={styles.emptyText}>
          Run a batch test from the Test Cases tab to see results here
        </p>
      </div>
    )
  }

  const { results, average_similarity, high_similarity_count, total, completed, failed } = batchResults

  // Build test name lookup
  const testMap = {}
  tests.forEach(t => { testMap[t.id] = t })

  return (
    <div style={styles.container}>
      {/* Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{completed}</div>
          <div style={styles.summaryLabel}>Completed</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{failed}</div>
          <div style={styles.summaryLabel}>Failed</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={{ ...styles.summaryValue, color: average_similarity >= 80 ? '#28a745' : average_similarity >= 50 ? '#ffc107' : '#dc3545' }}>
            {average_similarity.toFixed(1)}%
          </div>
          <div style={styles.summaryLabel}>Avg Similarity</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={{ ...styles.summaryValue, color: '#28a745' }}>{high_similarity_count}</div>
          <div style={styles.summaryLabel}>High Match (&gt;80%)</div>
        </div>
      </div>

      {/* Results table */}
      {results.map((result) => {
        const test = testMap[result.test_id]
        const festivalName = result.metadata?.festival_name || test?.name || result.test_id
        const year = result.metadata?.year || test?.year || ''
        const simPct = result.similarity?.similarity_percentage ?? null
        const simColor = simPct !== null
          ? (simPct >= 80 ? '#28a745' : simPct >= 50 ? '#ffc107' : '#dc3545')
          : '#999'

        return (
          <div key={result.test_id} style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div>
                <span style={styles.festivalName}>{festivalName} {year}</span>
                {result.status === 'failed' && (
                  <span style={styles.failedBadge}>Failed</span>
                )}
              </div>
              {simPct !== null && (
                <span style={{ ...styles.similarityBadge, backgroundColor: simColor }}>
                  {simPct.toFixed(1)}% SSIM
                </span>
              )}
            </div>

            {result.status === 'failed' && (
              <div>
                <div style={styles.errorBox}>{result.error}</div>
                {result.poster_url && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#555' }}>URL returned: </span>
                    <a href={result.poster_url} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
                      {result.poster_url.length > 80 ? result.poster_url.slice(0, 80) + '...' : result.poster_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {result.status === 'success' && (
              <div style={styles.resultBody}>
                <div style={styles.imageColumn}>
                  <h4 style={styles.columnTitle}>Returned Poster</h4>
                  {result.poster_url && (
                    <>
                      <a href={result.poster_url} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
                        {result.poster_url.length > 60 ? result.poster_url.slice(0, 60) + '...' : result.poster_url}
                      </a>
                      <div style={styles.iframeContainer}>
                        <iframe
                          src={result.poster_url}
                          title={`Poster for ${festivalName}`}
                          style={styles.iframe}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.imageColumn}>
                  <h4 style={styles.columnTitle}>Ground Truth</h4>
                  {test?.image_hash && (
                    <img
                      src={`/api/images/${test.image_hash}`}
                      alt={`Ground truth for ${festivalName}`}
                      style={styles.groundTruthImg}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  emptyState: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '60px 20px',
    textAlign: 'center',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '24px',
    marginBottom: '12px',
    color: '#333',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
  },
  summary: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  summaryItem: {
    flex: 1,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
  resultCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  festivalName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  failedBadge: {
    marginLeft: '10px',
    padding: '2px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
  },
  similarityBadge: {
    padding: '4px 12px',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  errorBox: {
    padding: '10px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
    fontSize: '14px',
  },
  resultBody: {
    display: 'flex',
    gap: '20px',
  },
  imageColumn: {
    flex: 1,
    minWidth: 0,
  },
  columnTitle: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '8px',
    marginTop: 0,
  },
  urlLink: {
    color: '#007bff',
    fontSize: '12px',
    wordBreak: 'break-all',
    display: 'block',
    marginBottom: '8px',
  },
  iframeContainer: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '300px',
    border: 'none',
  },
  groundTruthImg: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
}

export default PosterSearchResultsPage
