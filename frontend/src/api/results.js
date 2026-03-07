import { apiGet } from './client'

function getPrefix(workspace) {
  if (workspace === 'web-search') return '/web-search/executions'
  if (workspace === 'poster-search') return '/poster-search/executions'
  return '/executions'
}

export async function getLastResult(testId, workspace = 'image-eval') {
  return apiGet(`${getPrefix(workspace)}/results/${testId}`)
}

export async function getAllResults(workspace = 'image-eval') {
  return apiGet(`${getPrefix(workspace)}/results`)
}
