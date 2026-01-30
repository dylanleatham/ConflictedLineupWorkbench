import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWebSearchTests } from '../../hooks/useWebSearchTests'
import { useWebSearchExecution } from '../../hooks/useWebSearchExecution'
import { useWebSearchBatch } from '../../hooks/useWebSearchBatch'
import { useStickyState } from '../../hooks/useStickyState'
import TestCaseList from '../../components/TestCaseList'
import WebSearchBatchProgress from '../../components/WebSearchBatchProgress'
import ExecutionResult from '../../components/ExecutionResult'

// Default config matching PromptConfig.jsx defaults for web-search-eval
const DEFAULT_CONFIG = {
  system_prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
  claude_model: 'claude-sonnet-4-20250514'
}

function WebSearchTestCases({ onBatchComplete }) {
  const navigate = useNavigate()
  const { tests, deleteTest } = useWebSearchTests()
  const [wsConfig] = useStickyState(DEFAULT_CONFIG, 'web-search-eval:prompt-config')

  // Single test execution state
  const { execute: executeSingle, isExecuting: isSingleExecuting } = useWebSearchExecution()
  const [executingTestId, setExecutingTestId] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [singleResultTestName, setSingleResultTestName] = useState(null)

  // Batch execution state
  const { start: startBatch, cancel: cancelBatch, progress, results: batchResults, isRunning: isBatchRunning, error: batchError } = useWebSearchBatch()

  // Auto-navigate to results page when batch completes
  useEffect(() => {
    if (batchResults && !isBatchRunning) {
      if (onBatchComplete) {
        onBatchComplete(batchResults)
      }
      navigate('/web-search/results')
    }
  }, [batchResults, isBatchRunning, navigate, onBatchComplete])

  const handleRunAll = () => {
    startBatch(tests, wsConfig)
  }

  const handleRunSingle = async (test) => {
    setExecutingTestId(test.id)
    setSingleResult(null)
    try {
      const result = await executeSingle(test.id, test, wsConfig)
      setSingleResult(result)
      setSingleResultTestName(`${test.name} ${test.year}`)
    } catch (err) {
      console.error('Single test execution failed:', err)
    } finally {
      setExecutingTestId(null)
    }
  }

  const handleDelete = (test) => {
    if (window.confirm(`Are you sure you want to delete "${test.name}"?`)) {
      deleteTest(test.id)
    }
  }

  // Sort tests by year descending (most recent first)
  const sortedTests = [...tests].sort((a, b) => parseInt(b.year) - parseInt(a.year))

  return (
    <TestCaseList
      testCases={sortedTests}
      loading={false}
      error={null}
      variant="web-search"
      basePath="/web-search/test-cases"
      onRunSingle={handleRunSingle}
      onRunAll={handleRunAll}
      onDelete={handleDelete}
      executingTestId={executingTestId}
      isSingleExecuting={isSingleExecuting}
      isBatchRunning={isBatchRunning}
      batchProgress={progress}
      batchError={batchError}
      onCancelBatch={cancelBatch}
      ProgressComponent={WebSearchBatchProgress}
    >
      {singleResult && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>
            Result: {singleResultTestName}
          </h2>
          <ExecutionResult result={singleResult} />
        </div>
      )}
    </TestCaseList>
  )
}

export default WebSearchTestCases
