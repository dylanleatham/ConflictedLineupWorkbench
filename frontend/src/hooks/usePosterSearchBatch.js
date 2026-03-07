import { useState, useEffect, useRef, useCallback } from 'react'
import {
  startPosterSearchBatch,
  getPosterSearchBatchProgress,
  cancelPosterSearchBatch,
  getPosterSearchBatchResults
} from '../api/posterSearchExecutions'

export function usePosterSearchBatch() {
  const [batchId, setBatchId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)

  const currentBatchRef = useRef(null)

  useEffect(() => {
    if (!batchId || results) return

    currentBatchRef.current = batchId

    const pollProgress = async () => {
      try {
        const data = await getPosterSearchBatchProgress(batchId)
        if (currentBatchRef.current !== batchId) return

        setProgress(data)

        if (data.completed + data.failed >= data.total) {
          const finalResults = await getPosterSearchBatchResults(batchId)
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
    pollProgress()

    return () => {
      clearInterval(interval)
    }
  }, [batchId, results])

  const start = useCallback(async (tests, config) => {
    setIsRunning(true)
    setProgress(null)
    setResults(null)
    setError(null)

    try {
      const requestBody = {
        tests: tests.map(t => ({
          id: t.id,
          festival_name: t.name,
          year: t.year,
          image_hash: t.image_hash
        })),
        system_prompt: config.system_prompt || 'Search for the lineup poster image for this festival and return a single direct URL to the image.',
        model: config.claude_model || 'claude-sonnet-4-6'
      }
      const { batch_id } = await startPosterSearchBatch(requestBody)
      setBatchId(batch_id)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }, [])

  const cancel = useCallback(async () => {
    if (!batchId) return
    try {
      await cancelPosterSearchBatch(batchId)
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
