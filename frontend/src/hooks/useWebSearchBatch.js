import { useState, useEffect, useRef, useCallback } from 'react'
import {
  startWebSearchBatch,
  getWebSearchBatchProgress,
  cancelWebSearchBatch,
  getWebSearchBatchResults
} from '../api/webSearchExecutions'

/**
 * Hook for managing web search batch execution state with polling.
 *
 * Handles batch lifecycle: start, progress polling, cancellation, and results.
 * Polls every 1 second while batch is running.
 *
 * @returns {object} - { start, cancel, reset, progress, results, isRunning, error }
 */
export function useWebSearchBatch() {
  const [batchId, setBatchId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)

  const currentBatchRef = useRef(null)

  // Polling effect - 1 second interval
  useEffect(() => {
    if (!batchId || results) return

    currentBatchRef.current = batchId
    const controller = new AbortController()

    const pollProgress = async () => {
      try {
        const data = await getWebSearchBatchProgress(batchId)
        if (currentBatchRef.current !== batchId) return

        setProgress(data)

        // Check if complete
        if (data.completed + data.failed >= data.total) {
          const finalResults = await getWebSearchBatchResults(batchId)
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

  /**
   * Start batch execution.
   * @param {Array} tests - Array of test objects with { id, name, year, lineup }
   * @param {object} config - { system_prompt, claude_model }
   */
  const start = useCallback(async (tests, config) => {
    setIsRunning(true)
    setProgress(null)
    setResults(null)
    setError(null)

    try {
      const { batch_id } = await startWebSearchBatch({
        tests: tests.map(t => ({
          id: t.id,
          festival_name: t.name,
          year: t.year,
          ground_truth_lineup: t.lineup
        })),
        system_prompt: config.system_prompt,
        model: config.claude_model
      })
      setBatchId(batch_id)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }, [])

  /**
   * Cancel running batch.
   */
  const cancel = useCallback(async () => {
    if (!batchId) return
    try {
      await cancelWebSearchBatch(batchId)
      // Progress update will happen on next poll
    } catch (err) {
      setError(err.message)
    }
  }, [batchId])

  /**
   * Reset all batch state.
   */
  const reset = useCallback(() => {
    setBatchId(null)
    setProgress(null)
    setResults(null)
    setIsRunning(false)
    setError(null)
  }, [])

  return { start, cancel, reset, progress, results, isRunning, error }
}
