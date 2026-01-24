import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getTestCase, deleteTestCase } from '../api/testCases'
import { getImageUrl } from '../api/images'
import { useExecution } from '../hooks/useExecution'
import { useStickyState } from '../hooks/useStickyState'
import ExecutionResult from '../components/ExecutionResult'

function TestCaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Data state
  const [testCase, setTestCase] = useState(null)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Execution state
  const { execute, isExecuting, result, error: execError, reset } = useExecution()

  // Get prompt config from localStorage (same keys as PromptConfig)
  const [systemPrompt] = useStickyState(
    'Extract the festival lineup from this image. Return a JSON array of artist names.',
    'festival-evaluator:system-prompt'
  )
  const [claudeModel] = useStickyState(
    'claude-sonnet-4-20250514',
    'festival-evaluator:claude-model'
  )

  /**
   * Load test case data on mount.
   */
  useEffect(() => {
    const loadTestCase = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getTestCase(id)
        setTestCase(data)
      } catch (err) {
        setError(err.message || 'Failed to load test case')
      } finally {
        setIsLoading(false)
      }
    }

    loadTestCase()
  }, [id])

  /**
   * Handle delete button click - show confirmation dialog.
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  /**
   * Handle delete confirmation.
   */
  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await deleteTestCase(id)
      // Navigate back to list page after successful deletion
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to delete test case')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  /**
   * Handle delete cancellation.
   */
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  /**
   * Run text-based test (uses festival name).
   */
  const handleRunText = async () => {
    try {
      await execute(id, 'text', { system_prompt: systemPrompt, model: claudeModel })
    } catch {
      // Error is handled by useExecution hook
    }
  }

  /**
   * Run image-based test (uses festival image).
   */
  const handleRunImage = async () => {
    try {
      await execute(id, 'image', { system_prompt: systemPrompt, model: claudeModel })
    } catch {
      // Error is handled by useExecution hook
    }
  }

  /**
   * Clear execution result.
   */
  const handleClearResult = () => {
    reset()
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <p>Loading test case...</p>
      </div>
    )
  }

  // Error state (404 or other errors)
  if (error && !testCase) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <Link to="/" style={styles.backLink}>
          Back to List
        </Link>
      </div>
    )
  }

  // Main content
  return (
    <div style={styles.container}>
      {/* Header section */}
      <div style={styles.header}>
        <h1 style={styles.title}>{testCase.name}</h1>
        <div style={styles.actions}>
          <Link to={`/test-cases/${id}/edit`} style={styles.editButton}>
            Edit
          </Link>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            style={styles.deleteButton}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <Link to="/" style={styles.backLink}>
        Back to List
      </Link>

      {/* Error message (for delete errors) */}
      {error && testCase && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Run test section */}
      <div style={styles.runSection}>
        <h2 style={styles.sectionTitle}>Run Test</h2>
        <div style={styles.runButtons}>
          <button
            onClick={handleRunText}
            disabled={isExecuting}
            style={styles.runButton}
          >
            {isExecuting ? 'Running...' : 'Run Text Test'}
          </button>
          {testCase.image_hash && (
            <button
              onClick={handleRunImage}
              disabled={isExecuting}
              style={styles.runButton}
            >
              {isExecuting ? 'Running...' : 'Run Image Test'}
            </button>
          )}
          {result && (
            <button
              onClick={handleClearResult}
              style={styles.clearButton}
            >
              Clear Result
            </button>
          )}
        </div>
        {isExecuting && (
          <p style={styles.executingText}>
            Executing test with {claudeModel}...
          </p>
        )}
      </div>

      {/* Execution error */}
      {execError && (
        <div style={styles.error}>
          <strong>Execution error:</strong> {execError}
        </div>
      )}

      {/* Execution result */}
      <ExecutionResult result={result} />

      {/* Image display */}
      <div style={styles.imageSection}>
        <h2 style={styles.sectionTitle}>Festival Image</h2>
        {testCase.image_hash ? (
          <img
            src={getImageUrl(testCase.image_hash)}
            alt={testCase.name}
            style={styles.image}
          />
        ) : (
          <div style={styles.imagePlaceholder}>
            <p style={styles.placeholderText}>No image available</p>
          </div>
        )}
      </div>

      {/* Ground truth lineup */}
      <div style={styles.lineupSection}>
        <h2 style={styles.sectionTitle}>
          Lineup ({testCase.lineup.length} artists)
        </h2>
        <ul style={styles.lineupList}>
          {testCase.lineup.map((artist, index) => (
            <li key={index} style={styles.lineupItem}>
              {artist}
            </li>
          ))}
        </ul>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h2 style={styles.dialogTitle}>Confirm Delete</h2>
            <p style={styles.dialogMessage}>
              Delete <strong>{testCase.name}</strong>? This cannot be undone.
            </p>
            <div style={styles.dialogActions}>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={styles.confirmButton}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  editButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    display: 'inline-block',
  },
  deleteButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  backLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginBottom: '20px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
    marginBottom: '20px',
  },
  runSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  runButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  runButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  clearButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  executingText: {
    marginTop: '15px',
    color: '#666',
    fontStyle: 'italic',
  },
  imageSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#333',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '500px',
    objectFit: 'contain',
    border: '2px solid #ccc',
    borderRadius: '8px',
  },
  imagePlaceholder: {
    width: '100%',
    maxWidth: '600px',
    height: '300px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    color: '#999',
    fontSize: '16px',
  },
  lineupSection: {
    marginBottom: '30px',
  },
  lineupList: {
    listStyleType: 'disc',
    paddingLeft: '30px',
    margin: 0,
  },
  lineupItem: {
    fontSize: '16px',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  dialogTitle: {
    fontSize: '22px',
    marginTop: 0,
    marginBottom: '15px',
  },
  dialogMessage: {
    fontSize: '16px',
    marginBottom: '25px',
    lineHeight: '1.5',
  },
  dialogActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
}

export default TestCaseDetail
