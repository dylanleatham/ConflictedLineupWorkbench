import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebSearchTests } from '../../hooks/useWebSearchTests'
import { useWebSearchExecution } from '../../hooks/useWebSearchExecution'
import { useWebSearchBatch } from '../../hooks/useWebSearchBatch'
import { useStickyState } from '../../hooks/useStickyState'
import WebSearchBatchProgress from '../../components/WebSearchBatchProgress'
import WebSearchResultsTable from '../../components/WebSearchResultsTable'
import { exportWebSearchResults } from '../../utils/webSearchExport'

// Default config matching PromptConfig.jsx defaults for web-search-eval
const DEFAULT_CONFIG = {
  system_prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
  claude_model: 'claude-sonnet-4-20250514'
}

function TestCaseList({ onSingleResult, onBatchResults }) {
  const { tests, deleteTest } = useWebSearchTests()

  // Read web search config from localStorage (synced with PromptConfig)
  const [wsConfig] = useStickyState(DEFAULT_CONFIG, 'web-search-eval:prompt-config')

  // Single test execution state
  const { execute: executeSingle, isExecuting: isSingleExecuting } = useWebSearchExecution()
  const [executingTestId, setExecutingTestId] = useState(null)

  // Batch execution state
  const { start: startBatch, cancel: cancelBatch, progress, results: batchResults, isRunning: isBatchRunning, error: batchError } = useWebSearchBatch()

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteTest(id)
    }
  }

  const handleRunSingle = async (test) => {
    setExecutingTestId(test.id)
    try {
      const result = await executeSingle(test.id, test, wsConfig)
      if (onSingleResult) {
        onSingleResult(test.id, result)
      }
    } catch (err) {
      // Error is already captured in the hook
      console.error('Single test execution failed:', err)
    } finally {
      setExecutingTestId(null)
    }
  }

  const handleRunAll = () => {
    startBatch(tests, wsConfig)
  }

  const handleCancel = () => {
    cancelBatch()
  }

  // Notify parent when batch completes
  if (batchResults && onBatchResults) {
    onBatchResults(batchResults)
  }

  // Handle export
  const handleExport = () => {
    if (!batchResults) return
    exportWebSearchResults(batchResults, {
      system_prompt: wsConfig.system_prompt,
      model: wsConfig.claude_model
    })
  }

  // Sort tests by year descending (most recent first)
  const sortedTests = [...tests].sort((a, b) => parseInt(b.year) - parseInt(a.year))

  // Determine if any execution is in progress
  const anyExecutionRunning = isBatchRunning || executingTestId !== null

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Test Cases</h1>
        <div style={styles.headerButtons}>
          {sortedTests.length > 0 && (
            <button
              onClick={handleRunAll}
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
          <Link to="/web-search/test-cases/new" style={styles.addButton}>
            Add Test Case
          </Link>
        </div>
      </div>

      {batchError && (
        <div style={styles.errorBanner}>
          Error: {batchError}
        </div>
      )}

      {isBatchRunning && (
        <WebSearchBatchProgress progress={progress} onCancel={handleCancel} />
      )}

      {sortedTests.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No test cases yet.</p>
          <p>Create your first test case to get started.</p>
          <Link to="/web-search/test-cases/new" style={styles.createButton}>
            Create Test Case
          </Link>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Festival Name</th>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Artists</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTests.map((test) => {
              const isThisTestExecuting = executingTestId === test.id
              const isDisabled = isBatchRunning || (isSingleExecuting && !isThisTestExecuting)

              return (
                <tr key={test.id} style={styles.tr}>
                  <td style={styles.td}>{test.name}</td>
                  <td style={styles.td}>{test.year}</td>
                  <td style={styles.td}>{test.lineup.length}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleRunSingle(test)}
                        disabled={isDisabled || isThisTestExecuting}
                        style={{
                          ...styles.runButton,
                          opacity: (isDisabled || isThisTestExecuting) ? 0.6 : 1,
                          cursor: (isDisabled || isThisTestExecuting) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isThisTestExecuting ? 'Running...' : 'Run'}
                      </button>
                      <Link to={`/web-search/test-cases/${test.id}/edit`} style={styles.editLink}>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(test.id, test.name)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Results table when batch complete */}
      {batchResults && (
        <WebSearchResultsTable
          results={batchResults}
          tests={tests}
          onExport={handleExport}
        />
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  runAllButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  createButton: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '4px',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
    color: '#333',
  },
  tr: {
    borderBottom: '1px solid #e0e0e0',
  },
  td: {
    padding: '12px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  runButton: {
    padding: '4px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
  },
  editLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
  deleteButton: {
    padding: '4px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}

export default TestCaseList
