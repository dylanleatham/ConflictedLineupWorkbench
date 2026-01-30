import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTestCases, deleteTestCase } from '../api/testCases'
import { useBatchExecution } from '../hooks/useBatchExecution'
import { useExecution } from '../hooks/useExecution'
import { usePromptConfig } from '../hooks/usePromptConfig'
import TestCaseList from '../components/TestCaseList'
import BatchProgress from '../components/BatchProgress'

function ImageEvalTestCases({ onBatchComplete }) {
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [executingTestId, setExecutingTestId] = useState(null)

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
    start(testIds, 'image', { system_prompt: systemPrompt, model: claudeModel })
  }

  const handleRunSingle = async (testCase) => {
    setExecutingTestId(testCase.id)
    try {
      await executeSingle(testCase.id, 'image', { system_prompt: systemPrompt, model: claudeModel })
    } catch (err) {
      console.error('Single test execution failed:', err)
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
      variant="image"
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
    />
  )
}

export default ImageEvalTestCases
