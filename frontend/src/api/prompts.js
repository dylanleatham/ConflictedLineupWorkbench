/**
 * API functions for prompt configuration.
 */

import { apiGet, apiPut } from './client'

/**
 * Get current prompt configuration from the server.
 *
 * @returns {Promise<{system_prompt: string, claude_model: string}>}
 */
export async function getPromptConfig() {
  return apiGet('/prompts')
}

/**
 * Save prompt configuration to the server.
 *
 * @param {object} config - Configuration to save
 * @param {string} config.system_prompt - System prompt text
 * @param {string} config.claude_model - Claude model identifier
 * @returns {Promise<{system_prompt: string, claude_model: string}>}
 */
export async function savePromptConfig(config) {
  return apiPut('/prompts', config)
}
