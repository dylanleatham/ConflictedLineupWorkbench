import { useState } from 'react'
import { executePosterSearchTest } from '../api/posterSearchExecutions'

export function usePosterSearchExecution() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const execute = async (testId, testData, config) => {
    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      const data = await executePosterSearchTest(testId, {
        festival_name: testData.name,
        year: testData.year,
        image_hash: testData.image_hash,
        system_prompt: config.system_prompt || 'Search for the lineup poster image for this festival and return a single direct URL to the image.',
        model: config.claude_model || 'claude-sonnet-4-6'
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

  const reset = () => {
    setIsExecuting(false)
    setResult(null)
    setError(null)
  }

  return { execute, isExecuting, result, error, reset }
}
