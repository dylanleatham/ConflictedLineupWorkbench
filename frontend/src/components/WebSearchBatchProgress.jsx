/**
 * WebSearchBatchProgress Component
 *
 * Displays batch execution progress with count and cancel button.
 * Shows "Running X/Y..." format per CONTEXT.md specification.
 */
function WebSearchBatchProgress({ progress, onCancel }) {
  if (!progress) return null

  const { completed, failed, total, cancelled } = progress
  const percentage = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.text}>
          {cancelled ? 'Cancelled' : `Running ${completed + failed}/${total}...`}
        </span>
        {!cancelled && (
          <button onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
        )}
        {cancelled && <span style={styles.cancelledText}>Cancelling...</span>}
      </div>
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            backgroundColor: cancelled ? '#6c757d' : '#28a745'
          }}
        />
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  text: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  cancelButton: {
    padding: '5px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelledText: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  progressBar: {
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
}

export default WebSearchBatchProgress
