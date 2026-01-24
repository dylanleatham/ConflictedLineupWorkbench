import { useState } from 'react'
import { executeTest } from '../api/executions'

/**
 * Hook for managing individual test execution state.
 *
 * Handles loading, result, and error states for executing a single test.
 *
 * @returns {object} - { execute, isExecuting, result, error, reset }
 */
export function useExecution() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  /**
   * Execute a test.
   * @param {string} testId - Test case ID
   * @param {string} mode - "text" or "image"
   * @param {object} config - { system_prompt, model }
   * @returns {Promise<object>} - Execution result
   */
  const execute = async (testId, mode, config) => {
    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      const data = await executeTest(testId, mode, config)
      setResult(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsExecuting(false)
    }
  }

  /**
   * Reset execution state.
   */
  const reset = () => {
    setIsExecuting(false)
    setResult(null)
    setError(null)
  }

  return { execute, isExecuting, result, error, reset }
}
