import { downloadJSON } from './export'

/**
 * Export web search test results with configuration and summary
 * @param {Object} results - Batch results object
 * @param {Object} config - Configuration with model and system_prompt
 */
export function exportWebSearchResults(results, config) {
  // Calculate summary statistics
  const total = results.results.length
  const completed = results.results.filter(r => r.status === 'success').length
  const failed = results.results.filter(r => r.status === 'failed').length
  const perfect_count = results.results.filter(
    r => r.status === 'success' && r.accuracy?.accuracy_percentage === 100
  ).length

  // Calculate average accuracy (only from successful tests)
  const successfulTests = results.results.filter(r => r.status === 'success' && r.accuracy)
  const average_accuracy = successfulTests.length > 0
    ? successfulTests.reduce((sum, r) => sum + r.accuracy.accuracy_percentage, 0) / successfulTests.length
    : 0

  // Build export object
  const exportData = {
    exported_at: new Date().toISOString(),
    type: 'web-search-eval',
    config: {
      model: config.model,
      system_prompt: config.system_prompt
    },
    summary: {
      total,
      completed,
      failed,
      perfect_count,
      average_accuracy: Math.round(average_accuracy * 100) / 100
    },
    results: results.results
  }

  // Generate filename with timestamp
  const filename = `web-search-results-${Date.now()}.json`

  // Trigger download
  downloadJSON(exportData, filename)
}
