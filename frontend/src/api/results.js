import { apiGet } from './client'

export async function getLastResult(testId) {
  return apiGet(`/executions/results/${testId}`)
}

export async function getAllResults() {
  return apiGet('/executions/results')
}
