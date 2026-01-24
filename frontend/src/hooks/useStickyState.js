import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that persists state to localStorage and syncs across components.
 *
 * @param {*} defaultValue - Default value if nothing in localStorage
 * @param {string} key - localStorage key to store value under
 * @returns {[*, Function]} - Tuple of [value, setValue] like useState
 */
export function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  });

  // Track current value in ref for event listener comparison
  const valueRef = useRef(value);
  valueRef.current = value;

  // Persist to localStorage when value changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify other components
    window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key } }));
  }, [key, value]);

  // Listen for changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          if (newValue !== valueRef.current) {
            setValue(newValue);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    const handleLocalChange = (e) => {
      if (e.detail.key === key) {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          try {
            const newValue = JSON.parse(saved);
            // Only update if value is actually different (prevents infinite loop)
            if (newValue !== valueRef.current) {
              setValue(newValue);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleLocalChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleLocalChange);
    };
  }, [key]);

  return [value, setValue];
}
