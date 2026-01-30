import { useState, useEffect } from 'react'
import { useWebSearchTests } from '../../hooks/useWebSearchTests'
import { useWebSearchExecution } from '../../hooks/useWebSearchExecution'
import { useWebSearchBatch } from '../../hooks/useWebSearchBatch'
import { useStickyState } from '../../hooks/useStickyState'
import TestCaseList from '../../components/TestCaseList'
import WebSearchBatchProgress from '../../components/WebSearchBatchProgress'
import WebSearchResultsTable from '../../components/WebSearchResultsTable'
import { exportWebSearchResults } from '../../utils/webSearchExport'

// Default config matching PromptConfig.jsx defaults for web-search-eval
const DEFAULT_CONFIG = {
  system_prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
  claude_model: 'claude-sonnet-4-20250514'
}

function WebSearchTestCases({ onSingleResult, onBatchResults }) {
  const { tests, deleteTest } = useWebSearchTests()
  const [wsConfig] = useStickyState(DEFAULT_CONFIG, 'web-search-eval:prompt-config')

  // Single test execution state
  const { execute: executeSingle, isExecuting: isSingleExecuting } = useWebSearchExecution()
  const [executingTestId, setExecutingTestId] = useState(null)

  // Batch execution state
  const { start: startBatch, cancel: cancelBatch, progress, results: batchResults, isRunning: isBatchRunning, error: batchError } = useWebSearchBatch()

  // Notify parent when batch completes
  useEffect(() => {
    if (batchResults && onBatchResults) {
      onBatchResults(batchResults)
    }
  }, [batchResults, onBatchResults])

  const handleRunAll = () => {
    startBatch(tests, wsConfig)
  }

  const handleRunSingle = async (test) => {
    setExecutingTestId(test.id)
    try {
      const result = await executeSingle(test.id, test, wsConfig)
      if (onSingleResult) {
        onSingleResult(test.id, result)
      }
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

  const handleExport = () => {
    if (!batchResults) return
    exportWebSearchResults(batchResults, {
      system_prompt: wsConfig.system_prompt,
      model: wsConfig.claude_model
    })
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
      {batchResults && (
        <WebSearchResultsTable
          results={batchResults}
          tests={tests}
          onExport={handleExport}
        />
      )}
    </TestCaseList>
  )
}

export default WebSearchTestCases
