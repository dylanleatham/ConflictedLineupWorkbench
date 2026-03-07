import { apiPost, apiGet } from './client'

export async function executePosterSearchTest(testId, data) {
  return apiPost(`/poster-search/executions/${testId}`, data)
}

export async function startPosterSearchBatch(request) {
  return apiPost('/poster-search/executions/batch', request)
}

export async function getPosterSearchBatchProgress(batchId) {
  return apiGet(`/poster-search/executions/batch/${batchId}/progress`)
}

export async function cancelPosterSearchBatch(batchId) {
  return apiPost(`/poster-search/executions/batch/${batchId}/cancel`)
}

export async function getPosterSearchBatchResults(batchId) {
  return apiGet(`/poster-search/executions/batch/${batchId}/results`)
}
