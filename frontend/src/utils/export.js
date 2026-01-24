/**
 * Client-side JSON export utilities
 */

/**
 * Download data as a JSON file in the browser
 * @param {*} data - Data to serialize and download
 * @param {string} filename - Name for the downloaded file
 */
export function downloadJSON(data, filename) {
  // Serialize with formatting for readability
  const jsonString = JSON.stringify(data, null, 2)

  // Create Blob with JSON MIME type
  const blob = new Blob([jsonString], { type: 'application/json' })

  // Create object URL for the blob
  const url = URL.createObjectURL(blob)

  // Create temporary anchor element
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename

  // Trigger download
  anchor.click()

  // Cleanup
  anchor.remove()
  URL.revokeObjectURL(url)
}

/**
 * Export batch test results with configuration and summary
 * @param {Object} results - Batch results object containing test results array
 * @param {Object} config - Configuration object with model and system_prompt
 */
export function exportBatchResults(results, config) {
  // Calculate summary statistics
  const total = results.results.length
  const completed = results.results.filter(r => r.status === 'success').length
  const failed = results.results.filter(r => r.status === 'failed').length
  const perfect_count = results.results.filter(
    r => r.status === 'success' && r.accuracy.accuracy_percentage === 100
  ).length

  // Calculate average accuracy (only from successful tests)
  const successfulTests = results.results.filter(r => r.status === 'success')
  const average_accuracy = successfulTests.length > 0
    ? successfulTests.reduce((sum, r) => sum + r.accuracy.accuracy_percentage, 0) / successfulTests.length
    : 0

  // Build export object
  const exportData = {
    exported_at: new Date().toISOString(),
    config: {
      model: config.model,
      system_prompt: config.system_prompt
    },
    summary: {
      total,
      completed,
      failed,
      perfect_count,
      average_accuracy: Math.round(average_accuracy * 100) / 100 // Round to 2 decimals
    },
    results: results.results
  }

  // Generate filename with timestamp
  const filename = `batch-results-${Date.now()}.json`

  // Trigger download
  downloadJSON(exportData, filename)
}
