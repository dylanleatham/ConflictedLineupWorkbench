import { apiPost, apiGet } from './client'

/**
 * Client for one workspace's execution endpoints. All three workspaces share
 * the same route shape under different prefixes.
 *
 * @param {string} prefix - e.g. '/executions' or '/web-search/executions'
 */
function createExecutionApi(prefix) {
  return {
    /** Run one test. Returns the result; failures come back with status "failed". */
    execute: (testId, body) => apiPost(`${prefix}/${testId}`, body),
    /** Start a background batch. Returns { batch_id }. */
    startBatch: (body) => apiPost(`${prefix}/batch`, body),
    /** Returns { total, completed, failed, cancelled, current_test_id }. */
    getBatchProgress: (batchId) => apiGet(`${prefix}/batch/${batchId}/progress`),
    cancelBatch: (batchId) => apiPost(`${prefix}/batch/${batchId}/cancel`),
    /** Returns summary stats plus every individual result. */
    getBatchResults: (batchId) => apiGet(`${prefix}/batch/${batchId}/results`),
  }
}

export const imageEvalApi = createExecutionApi('/executions')
export const webSearchApi = createExecutionApi('/web-search/executions')
export const posterSearchApi = createExecutionApi('/poster-search/executions')
