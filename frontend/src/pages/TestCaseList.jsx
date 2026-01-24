import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTestCases } from '../api/testCases'
import TestCaseCard from '../components/TestCaseCard'
import { useBatchExecution } from '../hooks/useBatchExecution'
import { useStickyState } from '../hooks/useStickyState'
import BatchProgress from '../components/BatchProgress'
import BatchResultsModal from '../components/BatchResultsModal'

function TestCaseList({ onBatchComplete }) {
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const { start, cancel, reset, progress, results, isRunning, error: batchError } = useBatchExecution()

  const [systemPrompt] = useStickyState(
    'Extract the festival lineup from this image. Return a JSON array of artist names.',
    'festival-evaluator:system-prompt'
  )
  const [claudeModel] = useStickyState(
    'claude-sonnet-4-20250514',
    'festival-evaluator:claude-model'
  )

  useEffect(() => {
    async function fetchTestCases() {
      try {
        setLoading(true)
        const data = await getTestCases()
        setTestCases(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTestCases()
  }, [])

  // Auto-navigate to results page when batch completes
  useEffect(() => {
    if (progress?.status === 'complete') {
      // Get current config from localStorage
      const model = localStorage.getItem('festival-evaluator:claude-model') || 'claude-sonnet-4-20250514'
      const systemPrompt = localStorage.getItem('festival-evaluator:system-prompt') || ''

      // Call parent callback to store results
      if (onBatchComplete) {
        onBatchComplete(progress, { model, system_prompt: systemPrompt })
      }

      // Navigate to results page
      navigate('/results')
    }
  }, [progress?.status, navigate, onBatchComplete])

  const handleRunAll = (mode) => {
    const testIds = testCases.map(tc => tc.id)
    start(testIds, mode, { system_prompt: systemPrompt, model: claudeModel })
  }

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
          <Link to="/test-cases/new" className="button-primary">
            Add Test Case
          </Link>
          <button
            onClick={() => handleRunAll('text')}
            disabled={isRunning || testCases.length === 0}
            style={{
              ...styles.runAllButton,
              opacity: isRunning || testCases.length === 0 ? 0.6 : 1,
              cursor: isRunning || testCases.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Run All (Text)
          </button>
          <button
            onClick={() => handleRunAll('image')}
            disabled={isRunning || testCases.length === 0}
            style={{
              ...styles.runAllButton,
              opacity: isRunning || testCases.length === 0 ? 0.6 : 1,
              cursor: isRunning || testCases.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Run All (Image)
          </button>
        </div>
      </div>

      {batchError && (
        <div className="error" style={{ marginBottom: '20px' }}>
          <p>Batch error: {batchError}</p>
        </div>
      )}

      {isRunning && <BatchProgress progress={progress} onCancel={cancel} />}

      {testCases.length === 0 ? (
        <div className="empty-state">
          <p>No test cases yet.</p>
          <p>Create your first test case to get started.</p>
          <Link to="/test-cases/new" className="button-primary">
            Create Test Case
          </Link>
        </div>
      ) : (
        <div className="test-case-grid">
          {testCases.map((testCase) => (
            <TestCaseCard key={testCase.id} testCase={testCase} />
          ))}
        </div>
      )}
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
