import { useState, useEffect, useRef, useCallback } from 'react'
import { startBatch, getBatchProgress, cancelBatch, getBatchResults } from '../api/executions'

export function useBatchExecution() {
  const [batchId, setBatchId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)

  const currentBatchRef = useRef(null)

  // Polling effect
  useEffect(() => {
    if (!batchId || results) return

    currentBatchRef.current = batchId
    const controller = new AbortController()

    const pollProgress = async () => {
      try {
        const data = await getBatchProgress(batchId)
        if (currentBatchRef.current !== batchId) return

        setProgress(data)

        // Check if complete
        if (data.completed + data.failed >= data.total) {
          const finalResults = await getBatchResults(batchId)
          setResults(finalResults)
          setIsRunning(false)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      }
    }

    const interval = setInterval(pollProgress, 1000)
    pollProgress() // Initial fetch

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [batchId, results])

  const start = useCallback(async (testIds, config) => {
    setIsRunning(true)
    setProgress(null)
    setResults(null)
    setError(null)

    try {
      const { batch_id } = await startBatch({
        test_ids: testIds,
        ...config
      })
      setBatchId(batch_id)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }, [])

  const cancel = useCallback(async () => {
    if (!batchId) return
    try {
      await cancelBatch(batchId)
      // Progress update will happen on next poll
    } catch (err) {
      setError(err.message)
    }
  }, [batchId])

  const reset = useCallback(() => {
    setBatchId(null)
    setProgress(null)
    setResults(null)
    setIsRunning(false)
    setError(null)
  }, [])

  return { start, cancel, reset, progress, results, isRunning, error }
}
