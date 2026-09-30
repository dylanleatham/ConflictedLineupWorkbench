import { useState } from 'react'
import { imageEvalApi, webSearchApi, posterSearchApi } from '../api/executions'
import { WORKSPACE_DEFAULTS } from '../constants'

/**
 * Loading/result/error state around a single-test runner.
 *
 * @param {Function} run - (...args) => Promise<result>
 * @returns {object} - { execute, isExecuting, result, error, reset }
 */
function useSingleRun(run) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const execute = async (...args) => {
    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      const data = await run(...args)
      setResult(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsExecuting(false)
    }
  }

  const reset = () => {
    setIsExecuting(false)
    setResult(null)
    setError(null)
  }

  return { execute, isExecuting, result, error, reset }
}

/** Build a search request body from a test case and prompt config. */
function searchRequest(workspace, testData, config, fields) {
  const defaults = WORKSPACE_DEFAULTS[workspace]
  return {
    festival_name: testData.name,
    year: testData.year,
    ...fields,
    system_prompt: config.system_prompt || defaults.prompt,
    model: config.claude_model || defaults.model
  }
}

/** Image Eval: execute(testId, { system_prompt, model }) */
export function useExecution() {
  return useSingleRun((testId, config) => imageEvalApi.execute(testId, config))
}

/** Web Search Eval: execute(testId, { name, year, lineup }, { system_prompt, claude_model }) */
export function useWebSearchExecution() {
  return useSingleRun((testId, testData, config) =>
    webSearchApi.execute(testId, searchRequest('web-search-eval', testData, config, {
      ground_truth_lineup: testData.lineup
    }))
  )
}

/** Poster Search: execute(testId, { name, year, image_hash }, { system_prompt, claude_model }) */
export function usePosterSearchExecution() {
  return useSingleRun((testId, testData, config) =>
    posterSearchApi.execute(testId, searchRequest('poster-search-eval', testData, config, {
      image_hash: testData.image_hash
    }))
  )
}
