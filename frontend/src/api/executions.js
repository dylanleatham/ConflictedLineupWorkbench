import { apiPost } from './client'

/**
 * Execute a single test.
 * @param {string} testId - Test case ID
 * @param {string} mode - "text" or "image"
 * @param {object} config - { system_prompt, model }
 * @returns {Promise<object>} - Execution result with accuracy breakdown
 */
export async function executeTest(testId, mode, config) {
  return apiPost(`/executions/${testId}/${mode}`, config)
}
