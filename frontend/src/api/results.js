import { apiGet } from './client'

export async function getLastResult(testId, workspace = 'image-eval') {
  const prefix = workspace === 'web-search' ? '/web-search/executions' : '/executions'
  return apiGet(`${prefix}/results/${testId}`)
}

export async function getAllResults(workspace = 'image-eval') {
  const prefix = workspace === 'web-search' ? '/web-search/executions' : '/executions'
  return apiGet(`${prefix}/results`)
}
