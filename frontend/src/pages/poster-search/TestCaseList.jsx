import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTestCases, deleteTestCase } from '../../api/testCases'
import { getAllResults } from '../../api/results'
import { usePosterSearchExecution } from '../../hooks/useExecution'
import { usePosterSearchBatch } from '../../hooks/useBatchExecution'
import { useStickyState } from '../../hooks/useStickyState'
import TestCaseList from '../../components/TestCaseList'
import WebSearchBatchProgress from '../../components/WebSearchBatchProgress'
import PosterSearchResult from './PosterSearchResult'

const DEFAULT_CONFIG = {
  system_prompt: 'Search for the lineup poster image for this festival and return a JSON object with the following fields: "poster_url" (direct URL to the poster image), "source_url" (URL of the page where the poster was found), and "lineup_text" (the lineup text extracted from the poster or page, if available). Return only the JSON object, no other text.',
  claude_model: 'claude-sonnet-4-6'
}

function PosterSearchTestCases({ onBatchComplete }) {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [psConfig] = useStickyState(DEFAULT_CONFIG, 'poster-search-eval:prompt-config')

  useEffect(() => {
    fetchTests()
  }, [])

  async function fetchTests() {
    try {
      setLoading(true)
      const data = await getTestCases()
      setTests(data)
      setError(null)

      try {
        const savedResults = await getAllResults('poster-search')
        setTestResults(savedResults)
      } catch {
        // No saved results yet
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const { execute: executeSingle, isExecuting: isSingleExecuting } = usePosterSearchExecution()
  const [executingTestId, setExecutingTestId] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [singleResultTestName, setSingleResultTestName] = useState(null)
  const [testResults, setTestResults] = useState({})

  const { start: startBatch, cancel: cancelBatch, progress, results: batchResults, isRunning: isBatchRunning, error: batchError } = usePosterSearchBatch()

  useEffect(() => {
    if (batchResults && !isBatchRunning) {
      if (onBatchComplete) {
        onBatchComplete(batchResults)
      }
      navigate('/poster-search/results')
    }
  }, [batchResults, isBatchRunning, navigate, onBatchComplete])

  const handleRunAll = () => {
    startBatch(tests, psConfig)
  }

  const handleRunSingle = async (test) => {
    setExecutingTestId(test.id)
    setSingleResult(null)
    try {
      const result = await executeSingle(test.id, test, psConfig)
      setSingleResult(result)
      setSingleResultTestName(`${test.name} ${test.year}`)
      setTestResults(prev => ({ ...prev, [test.id]: result }))
    } catch (err) {
      console.error('Single test execution failed:', err)
      const errorResult = { status: 'failed', error: err.message }
      setSingleResult(errorResult)
      setSingleResultTestName(`${test.name} ${test.year}`)
      setTestResults(prev => ({ ...prev, [test.id]: errorResult }))
    } finally {
      setExecutingTestId(null)
    }
  }

  const handleDelete = async (test) => {
    if (window.confirm(`Are you sure you want to delete "${test.name}"?`)) {
      try {
        await deleteTestCase(test.id)
        await fetchTests()
      } catch (err) {
        setError(`Failed to delete: ${err.message}`)
      }
    }
  }

  const sortedTests = [...tests].sort((a, b) => parseInt(b.year) - parseInt(a.year))

  return (
    <TestCaseList
      testCases={sortedTests}
      loading={loading}
      error={error}
      basePath="/poster-search/test-cases"
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
      testResults={testResults}
      cardDetailSuffix="results"
    >
      {singleResult && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>
            Result: {singleResultTestName}
          </h2>
          <PosterSearchResult result={singleResult} />
        </div>
      )}
    </TestCaseList>
  )
}

export default PosterSearchTestCases
