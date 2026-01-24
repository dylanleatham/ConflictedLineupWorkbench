import { createPortal } from 'react-dom'

function BatchResultsModal({ results, onClose }) {
  if (!results) return null

  const { total, completed, failed, perfect_count, average_accuracy, results: testResults } = results

  const modalContent = (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>Batch Execution Results</h2>

        <div style={styles.summary}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{completed}/{total}</span>
            <span style={styles.statLabel}>Tests Completed</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{perfect_count}</span>
            <span style={styles.statLabel}>Perfect Scores (100%)</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{average_accuracy.toFixed(1)}%</span>
            <span style={styles.statLabel}>Average Accuracy</span>
          </div>
          {failed > 0 && (
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: '#dc3545' }}>{failed}</span>
              <span style={styles.statLabel}>Failed</span>
            </div>
          )}
        </div>

        <div style={styles.resultsList}>
          <h3>Individual Results</h3>
          {testResults.map((r, i) => (
            <div key={i} style={styles.resultItem}>
              <span style={styles.testId}>{r.test_id}</span>
              {r.status === 'success' ? (
                <span style={{
                  ...styles.accuracy,
                  color: r.accuracy.accuracy_percentage === 100 ? '#28a745' : '#333'
                }}>
                  {r.accuracy.matched}/{r.accuracy.total_ground_truth}
                  ({r.accuracy.accuracy_percentage}%)
                </span>
              ) : (
                <span style={styles.failed}>Failed: {r.error}</span>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  )

  return createPortal(modalContent, document.getElementById('modal-root'))
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  title: {
    marginTop: 0,
    marginBottom: '20px'
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
  },
  stat: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#28a745'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6c757d'
  },
  resultsList: {
    borderTop: '1px solid #dee2e6',
    paddingTop: '15px',
    marginBottom: '20px'
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  },
  testId: {
    fontWeight: '500'
  },
  accuracy: {
    fontFamily: 'monospace'
  },
  failed: {
    color: '#dc3545'
  },
  closeButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  }
}

export default BatchResultsModal
