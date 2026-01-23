/**
 * API functions for image management.
 */

import { apiUpload } from './client'

const BASE_URL = '/api'

/**
 * Upload an image file.
 *
 * @param {File} file - Image file to upload
 * @returns {Promise<{hash: string}>} - Object containing the image hash
 */
export async function uploadImage(file) {
  return apiUpload('/images', file)
}

/**
 * Get the URL for an image by hash.
 *
 * @param {string} hash - Image hash (SHA-256)
 * @returns {string} - URL to use as img src
 */
export function getImageUrl(hash) {
  return `${BASE_URL}/images/${hash}`
}
