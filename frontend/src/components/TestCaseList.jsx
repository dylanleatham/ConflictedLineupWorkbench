import { Link } from 'react-router-dom'
import TestCaseCard from './TestCaseCard'

/**
 * Reusable test case list component for both Image Eval and Web Search Eval.
 *
 * @param {object} props
 * @param {Array} props.testCases - Array of test case objects
 * @param {boolean} props.loading - Whether test cases are loading
 * @param {string} props.error - Error message if loading failed
 * @param {string} props.variant - "image" | "web-search"
 * @param {string} props.basePath - Base path for routes (e.g., "/test-cases" or "/web-search/test-cases")
 * @param {function} props.onRunSingle - (testCase) => void - Called when Run button is clicked
 * @param {function} props.onRunAll - () => void - Called when Run All button is clicked
 * @param {function} props.onDelete - (testCase) => void - Called when Delete button is clicked
 * @param {string|null} props.executingTestId - ID of currently executing single test
 * @param {boolean} props.isSingleExecuting - Whether any single test is executing
 * @param {boolean} props.isBatchRunning - Whether batch execution is in progress
 * @param {object} props.batchProgress - Batch progress object { completed, total, current }
 * @param {string} props.batchError - Batch error message
 * @param {function} props.onCancelBatch - Called to cancel batch execution
 * @param {React.ComponentType} props.ProgressComponent - Component to render batch progress
 * @param {React.ReactNode} props.children - Optional content to render after the grid (e.g., results table)
 * @param {object} props.testResults - Map of test ID to last result { [testId]: result }
 */
function TestCaseList({
  testCases,
  loading,
  error,
  variant,
  basePath,
  onRunSingle,
  onRunAll,
  onDelete,
  executingTestId,
  isSingleExecuting,
  isBatchRunning,
  batchProgress,
  batchError,
  onCancelBatch,
  ProgressComponent,
  children,
  testResults = {},
}) {
  const anyExecutionRunning = isBatchRunning || executingTestId !== null

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading test cases...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error loading test cases</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Test Cases</h1>
        <div style={styles.actions}>
          <Link to={`${basePath}/new`} className="button-primary">
            Add Test Case
          </Link>
          {testCases.length > 0 && (
            <button
              onClick={onRunAll}
              disabled={anyExecutionRunning}
              style={{
                ...styles.runAllButton,
                opacity: anyExecutionRunning ? 0.6 : 1,
                cursor: anyExecutionRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isBatchRunning ? 'Running...' : 'Run All'}
            </button>
          )}
        </div>
      </div>

      {batchError && (
        <div className="error" style={{ marginBottom: '20px' }}>
          <p>Error: {batchError}</p>
        </div>
      )}

      {isBatchRunning && ProgressComponent && (
        <ProgressComponent progress={batchProgress} onCancel={onCancelBatch} />
      )}

      {testCases.length === 0 ? (
        <div className="empty-state">
          <p>No test cases yet.</p>
          <p>Create your first test case to get started.</p>
          <Link to={`${basePath}/new`} className="button-primary">
            Create Test Case
          </Link>
        </div>
      ) : (
        <div className="test-case-grid">
          {testCases.map((testCase) => {
            const isThisTestRunning = executingTestId === testCase.id
            const isDisabled = isBatchRunning || (isSingleExecuting && !isThisTestRunning)

            return (
              <TestCaseCard
                key={testCase.id}
                testCase={testCase}
                variant={variant}
                onRun={() => onRunSingle(testCase)}
                onDelete={() => onDelete(testCase)}
                detailPath={`${basePath}/${testCase.id}/edit`}
                editPath={`${basePath}/${testCase.id}/edit`}
                isRunning={isThisTestRunning}
                isDisabled={isDisabled}
                lastResult={testResults[testCase.id]}
              />
            )
          })}
        </div>
      )}

      {children}
    </div>
  )
}

const styles = {
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  runAllButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
}

export default TestCaseList
