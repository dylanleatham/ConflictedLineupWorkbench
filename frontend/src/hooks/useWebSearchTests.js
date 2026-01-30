import { useCallback } from 'react'
import { useStickyState } from './useStickyState'

/**
 * Custom hook for managing web search test cases with localStorage persistence.
 *
 * Test case structure:
 * {
 *   id: string (UUID),
 *   name: string (festival name),
 *   year: string (4-digit year),
 *   lineup: string[] (array of artist names)
 * }
 *
 * @returns {Object} Test case CRUD operations
 */
export function useWebSearchTests() {
  const [tests, setTests] = useStickyState([], 'web-search-eval:test-cases')

  /**
   * Create a new test case.
   * @param {string} name - Festival name
   * @param {string} year - Festival year (4 digits)
   * @param {string[]} lineup - Array of artist names
   * @returns {Object} Created test case
   */
  const createTest = (name, year, lineup) => {
    const newTest = {
      id: crypto.randomUUID(),
      name,
      year,
      lineup
    }

    setTests(prev => [...prev, newTest])
    return newTest
  }

  /**
   * Update an existing test case.
   * @param {string} id - Test case ID
   * @param {Object} updates - Fields to update
   */
  const updateTest = (id, updates) => {
    setTests(prev =>
      prev.map(test =>
        test.id === id ? { ...test, ...updates } : test
      )
    )
  }

  /**
   * Delete a test case.
   * @param {string} id - Test case ID
   */
  const deleteTest = (id) => {
    setTests(prev => prev.filter(test => test.id !== id))
  }

  /**
   * Get a single test case by ID.
   * @param {string} id - Test case ID
   * @returns {Object|undefined} Test case or undefined if not found
   */
  const getTest = useCallback((id) => {
    return tests.find(test => test.id === id)
  }, [tests])

  return {
    tests,
    createTest,
    updateTest,
    deleteTest,
    getTest
  }
}
