/**
 * API functions for test case management.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client'

/**
 * Create a new test case.
 *
 * @param {string} name - Test case name
 * @param {string[]} lineup - Expected lineup (array of artist names)
 * @param {string|null} imageHash - Optional image hash
 * @returns {Promise<object>} - Created test case
 */
export async function createTestCase(name, lineup, imageHash = null, year = null) {
  const body = { name, lineup, image_hash: imageHash }
  if (year) body.year = year
  return apiPost('/test-cases', body)
}

/**
 * Get all test cases.
 *
 * @returns {Promise<object[]>} - Array of test cases
 */
export async function getTestCases() {
  return apiGet('/test-cases')
}

/**
 * Get a single test case by ID.
 *
 * @param {string} id - Test case ID
 * @returns {Promise<object>} - Test case
 */
export async function getTestCase(id) {
  return apiGet(`/test-cases/${id}`)
}

/**
 * Update a test case.
 *
 * @param {string} id - Test case ID
 * @param {object} updates - Fields to update (name, lineup, image_hash)
 * @returns {Promise<object>} - Updated test case
 */
export async function updateTestCase(id, updates) {
  return apiPut(`/test-cases/${id}`, updates)
}

/**
 * Delete a test case.
 *
 * @param {string} id - Test case ID
 * @returns {Promise<null>} - Resolves when deleted
 */
export async function deleteTestCase(id) {
  return apiDelete(`/test-cases/${id}`)
}
