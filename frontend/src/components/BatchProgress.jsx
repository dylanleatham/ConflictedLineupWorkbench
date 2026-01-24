function BatchProgress({ progress, onCancel }) {
  if (!progress) return null

  const { total, completed, failed, current_test_id, cancelled } = progress
  const percentage = total > 0 ? Math.round((completed + failed) / total * 100) : 0

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Running batch: {completed + failed}/{total}</span>
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
            width: `${percentage}%`
          }}
        />
      </div>

      {current_test_id && (
        <div style={styles.currentTest}>
          Currently testing: {current_test_id}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  cancelButton: {
    padding: '5px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelledText: {
    color: '#6c757d',
    fontStyle: 'italic'
  },
  progressBar: {
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.3s ease'
  },
  currentTest: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#6c757d'
  }
}

export default BatchProgress
