import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTestCases, deleteTestCase } from '../api/testCases'
import { getAllResults } from '../api/results'
import { useBatchExecution } from '../hooks/useBatchExecution'
import { useExecution } from '../hooks/useExecution'
import { usePromptConfig } from '../hooks/usePromptConfig'
import TestCaseList from '../components/TestCaseList'
import BatchProgress from '../components/BatchProgress'
import ExecutionResult from '../components/ExecutionResult'

function ImageEvalTestCases({ onBatchComplete }) {
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [executingTestId, setExecutingTestId] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [singleResultTestName, setSingleResultTestName] = useState(null)
  const [testResults, setTestResults] = useState({})

  const navigate = useNavigate()
  const { start, cancel, progress, results, isRunning, error: batchError } = useBatchExecution()
  const { execute: executeSingle, isExecuting: isSingleExecuting } = useExecution()
  const { systemPrompt, claudeModel } = usePromptConfig()

  useEffect(() => {
    fetchTestCases()
  }, [])

  async function fetchTestCases() {
    try {
      setLoading(true)
      const data = await getTestCases()
      setTestCases(data)
      setError(null)

      // Load persisted results for card badges
      try {
        const savedResults = await getAllResults()
        setTestResults(savedResults)
      } catch {
        // No saved results yet - that's fine
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-navigate to results page when batch completes
  useEffect(() => {
    if (results && !isRunning) {
      if (onBatchComplete) {
        onBatchComplete(results, { model: claudeModel, system_prompt: systemPrompt })
      }
      navigate('/results')
    }
  }, [results, isRunning, navigate, onBatchComplete, claudeModel, systemPrompt])

  const handleRunAll = () => {
    const testIds = testCases.map(tc => tc.id)
    start(testIds, { system_prompt: systemPrompt, model: claudeModel })
  }

  const handleRunSingle = async (testCase) => {
    setExecutingTestId(testCase.id)
    setSingleResult(null)
    try {
      const result = await executeSingle(testCase.id, { system_prompt: systemPrompt, model: claudeModel })
      setSingleResult(result)
      setSingleResultTestName(testCase.name)
      setTestResults(prev => ({ ...prev, [testCase.id]: result }))
    } catch (err) {
      console.error('Single test execution failed:', err)
      const errorResult = { status: 'failed', error: err.message }
      setSingleResult(errorResult)
      setSingleResultTestName(testCase.name)
      setTestResults(prev => ({ ...prev, [testCase.id]: errorResult }))
    } finally {
      setExecutingTestId(null)
    }
  }

  const handleDelete = async (testCase) => {
    if (window.confirm(`Are you sure you want to delete "${testCase.name}"?`)) {
      try {
        await deleteTestCase(testCase.id)
        await fetchTestCases()
      } catch (err) {
        setError(`Failed to delete: ${err.message}`)
      }
    }
  }

  return (
    <TestCaseList
      testCases={testCases}
      loading={loading}
      error={error}
      basePath="/test-cases"
      onRunSingle={handleRunSingle}
      onRunAll={handleRunAll}
      onDelete={handleDelete}
      executingTestId={executingTestId}
      isSingleExecuting={isSingleExecuting}
      isBatchRunning={isRunning}
      batchProgress={progress}
      batchError={batchError}
      onCancelBatch={cancel}
      ProgressComponent={BatchProgress}
      testResults={testResults}
      cardDetailSuffix="results"
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

export default ImageEvalTestCases
