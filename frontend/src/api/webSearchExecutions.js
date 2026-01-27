import { apiPost, apiGet } from './client'

/**
 * Execute a single web search test.
 * @param {string} testId - Test case ID
 * @param {object} data - { festival_name, year, ground_truth_lineup, system_prompt, model }
 * @returns {Promise<object>} - Execution result with accuracy breakdown
 */
export async function executeWebSearchTest(testId, data) {
  return apiPost(`/web-search/executions/${testId}`, data)
}

/**
 * Start web search batch execution.
 * @param {object} request - { tests: [{id, festival_name, year, ground_truth_lineup}], system_prompt, model }
 * @returns {Promise<object>} - { batch_id }
 */
export async function startWebSearchBatch(request) {
  return apiPost('/web-search/executions/batch', request)
}

/**
 * Get batch progress.
 * @param {string} batchId - Batch execution ID
 * @returns {Promise<object>} - { total, completed, failed, cancelled }
 */
export async function getWebSearchBatchProgress(batchId) {
  return apiGet(`/web-search/executions/batch/${batchId}/progress`)
}

/**
 * Cancel batch execution.
 * @param {string} batchId - Batch execution ID
 */
export async function cancelWebSearchBatch(batchId) {
  return apiPost(`/web-search/executions/batch/${batchId}/cancel`)
}

/**
 * Get batch results.
 * @param {string} batchId - Batch execution ID
 * @returns {Promise<object>} - Batch results with individual test results
 */
export async function getWebSearchBatchResults(batchId) {
  return apiGet(`/web-search/executions/batch/${batchId}/results`)
}
