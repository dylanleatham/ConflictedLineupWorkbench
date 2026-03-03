/**
 * Hook for consuming prompt configuration.
 *
 * Loads config from backend on mount and syncs with localStorage updates
 * from PromptConfig component.
 */

import { useState, useEffect, useCallback } from 'react'
import { getPromptConfig } from '../api/prompts'

const DEFAULT_SYSTEM_PROMPT = 'Extract the festival lineup from this image. Return a JSON array of artist names.'
const DEFAULT_MODEL = 'claude-sonnet-4-6-20250610'
const STORAGE_KEY = 'festival-evaluator:prompt-config'

/**
 * Hook for reading prompt configuration.
 *
 * Loads from backend on mount and syncs with localStorage changes.
 * Use this in components that need to read (but not edit) the prompt config.
 *
 * @returns {{ systemPrompt: string, claudeModel: string, loading: boolean }}
 */
export function usePromptConfig() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [claudeModel, setClaudeModel] = useState(DEFAULT_MODEL)
  const [loading, setLoading] = useState(true)

  // Load from localStorage first (fast), then validate with backend
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        if (config.system_prompt) setSystemPrompt(config.system_prompt)
        if (config.claude_model) setClaudeModel(config.claude_model)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Load from backend on mount
  useEffect(() => {
    let mounted = true

    async function loadConfig() {
      // First, try localStorage for instant display
      loadFromStorage()

      // Then fetch from backend
      try {
        const config = await getPromptConfig()
        if (mounted) {
          setSystemPrompt(config.system_prompt)
          setClaudeModel(config.claude_model)
        }
      } catch (err) {
        console.error('Failed to load prompt config:', err)
        // Keep localStorage values on error
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadConfig()

    return () => {
      mounted = false
    }
  }, [loadFromStorage])

  // Listen for localStorage changes (from PromptConfig component)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Cross-tab storage event
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const config = JSON.parse(e.newValue)
          if (config.system_prompt) setSystemPrompt(config.system_prompt)
          if (config.claude_model) setClaudeModel(config.claude_model)
        } catch {
          // Ignore parse errors
        }
      }
    }

    const handleCustomStorageChange = (e) => {
      // Same-tab custom event from PromptConfig
      if (e.detail?.key === STORAGE_KEY) {
        loadFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-storage-change', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-storage-change', handleCustomStorageChange)
    }
  }, [loadFromStorage])

  return { systemPrompt, claudeModel, loading }
}
