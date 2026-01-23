import { useState, useEffect } from 'react';

/**
 * Custom hook that persists state to localStorage.
 *
 * @param {*} defaultValue - Default value if nothing in localStorage
 * @param {string} key - localStorage key to store value under
 * @returns {[*, Function]} - Tuple of [value, setValue] like useState
 */
export function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    // Lazy initialization: read from localStorage on first render
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        // Handle corrupted localStorage - fall back to default
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    // Persist to localStorage whenever value changes
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
