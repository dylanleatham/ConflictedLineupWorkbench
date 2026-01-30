import { apiPost, apiGet } from './client'

/**
 * Execute a single test.
 * @param {string} testId - Test case ID
 * @param {object} config - { system_prompt, model }
 * @returns {Promise<object>} - Execution result with accuracy breakdown
 */
export async function executeTest(testId, config) {
  return apiPost(`/executions/${testId}`, config)
}

/**
 * Start batch execution.
 * @param {object} request - { test_ids, system_prompt, model }
 */
export async function startBatch(request) {
  return apiPost('/executions/batch', request)
}

/**
 * Get batch progress.
 */
export async function getBatchProgress(batchId) {
  return apiGet(`/executions/batch/${batchId}/progress`)
}

/**
 * Cancel batch execution.
 */
export async function cancelBatch(batchId) {
  return apiPost(`/executions/batch/${batchId}/cancel`)
}

/**
 * Get batch results.
 */
export async function getBatchResults(batchId) {
  return apiGet(`/executions/batch/${batchId}/results`)
}
