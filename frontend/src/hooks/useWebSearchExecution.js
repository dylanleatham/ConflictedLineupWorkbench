import { useState } from 'react'
import { executeWebSearchTest } from '../api/webSearchExecutions'

/**
 * Hook for managing individual web search test execution state.
 *
 * Handles loading, result, and error states for executing a single test.
 *
 * @returns {object} - { execute, isExecuting, result, error, reset }
 */
export function useWebSearchExecution() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  /**
   * Execute a web search test.
   * @param {string} testId - Test case ID
   * @param {object} testData - { name, year, lineup }
   * @param {object} config - { system_prompt, claude_model }
   * @returns {Promise<object>} - Execution result
   */
  const execute = async (testId, testData, config) => {
    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      const data = await executeWebSearchTest(testId, {
        festival_name: testData.name,
        year: testData.year,
        ground_truth_lineup: testData.lineup,
        system_prompt: config.system_prompt || 'Search for the festival lineup and return the artist names as a JSON array.',
        model: config.claude_model || 'claude-sonnet-4-20250514'
      })
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
