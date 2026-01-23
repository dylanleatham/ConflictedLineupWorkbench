/**
 * Base API client for making requests to the FastAPI backend.
 *
 * Uses Vite proxy, so all requests go to /api which is proxied to http://localhost:8000
 */

const BASE_URL = '/api'

/**
 * Handle API response and errors.
 *
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - If response is not ok
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorData = await response.json()
      if (errorData.detail) {
        errorMessage = errorData.detail
      }
    } catch {
      // If response is not JSON, use status text
    }

    throw new Error(errorMessage)
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null
  }

  return response.json()
}

/**
 * Make a GET request.
 *
 * @param {string} path - API endpoint path (e.g., "/test-cases")
 * @returns {Promise<any>} - Response data
 */
export async function apiGet(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return handleResponse(response)
}

/**
 * Make a POST request.
 *
 * @param {string} path - API endpoint path
 * @param {object} body - Request body (will be JSON stringified)
 * @returns {Promise<any>} - Response data
 */
export async function apiPost(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return handleResponse(response)
}

/**
 * Make a PUT request.
 *
 * @param {string} path - API endpoint path
 * @param {object} body - Request body (will be JSON stringified)
 * @returns {Promise<any>} - Response data
 */
export async function apiPut(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return handleResponse(response)
}

/**
 * Make a DELETE request.
 *
 * @param {string} path - API endpoint path
 * @returns {Promise<null>} - Always returns null for successful deletes
 */
export async function apiDelete(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
  })

  return handleResponse(response)
}

/**
 * Upload a file using multipart/form-data.
 *
 * @param {string} path - API endpoint path
 * @param {File} file - File to upload
 * @returns {Promise<any>} - Response data
 */
export async function apiUpload(path, file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse(response)
}
