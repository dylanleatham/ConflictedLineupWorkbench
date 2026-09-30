import { useState, useEffect, useRef, useCallback } from 'react'
import { imageEvalApi, webSearchApi, posterSearchApi } from '../api/executions'
import { WORKSPACE_DEFAULTS } from '../constants'

const POLL_INTERVAL_MS = 1000

/**
 * Batch lifecycle for one workspace: start, poll progress, cancel, fetch results.
 *
 * @param {object} api - Workspace client from api/executions
 * @param {Function} buildRequest - (tests, config) => batch request body
 * @returns {object} - { start, cancel, reset, progress, results, isRunning, error }
 */
function useBatchRunner(api, buildRequest) {
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
        const data = await api.getBatchProgress(batchId)
        if (currentBatchRef.current !== batchId) return

        setProgress(data)

        // `completed` already includes failures; a cancelled batch is done once
        // the backend loop exits and clears current_test_id
        const done = data.completed >= data.total || (data.cancelled && !data.current_test_id)
        if (done) {
          setResults(await api.getBatchResults(batchId))
          setIsRunning(false)
        }
      } catch (err) {
        setError(err.message)
      }
    }

    const interval = setInterval(pollProgress, POLL_INTERVAL_MS)
    pollProgress()

    return () => clearInterval(interval)
  }, [api, batchId, results])

  const start = useCallback(async (tests, config) => {
    setIsRunning(true)
    setProgress(null)
    setResults(null)
    setError(null)

    try {
      const { batch_id } = await api.startBatch(buildRequest(tests, config))
      setBatchId(batch_id)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }, [api, buildRequest])

  const cancel = useCallback(async () => {
    if (!batchId) return
    try {
      await api.cancelBatch(batchId)
      // The next poll picks up the cancelled state
    } catch (err) {
      setError(err.message)
    }
  }, [api, batchId])

  const reset = useCallback(() => {
    setBatchId(null)
    setProgress(null)
    setResults(null)
    setIsRunning(false)
    setError(null)
  }, [])

  return { start, cancel, reset, progress, results, isRunning, error }
}

// Request builders live at module scope so their identity is stable across renders

/** Image Eval: start(testIds, { system_prompt, model }) */
const imageEvalRequest = (testIds, config) => ({ test_ids: testIds, ...config })

function searchBatchRequest(workspace, toTest) {
  const defaults = WORKSPACE_DEFAULTS[workspace]
  return (tests, config) => ({
    tests: tests.map((t) => ({ id: t.id, festival_name: t.name, year: t.year, ...toTest(t) })),
    system_prompt: config.system_prompt || defaults.prompt,
    model: config.claude_model || defaults.model
  })
}

/** Web Search Eval: start(tests: [{ id, name, year, lineup }], { system_prompt, claude_model }) */
const webSearchRequest = searchBatchRequest('web-search-eval', (t) => ({ ground_truth_lineup: t.lineup }))

/** Poster Search: start(tests: [{ id, name, year, image_hash }], { system_prompt, claude_model }) */
const posterSearchRequest = searchBatchRequest('poster-search-eval', (t) => ({ image_hash: t.image_hash }))

export const useBatchExecution = () => useBatchRunner(imageEvalApi, imageEvalRequest)
export const useWebSearchBatch = () => useBatchRunner(webSearchApi, webSearchRequest)
export const usePosterSearchBatch = () => useBatchRunner(posterSearchApi, posterSearchRequest)
