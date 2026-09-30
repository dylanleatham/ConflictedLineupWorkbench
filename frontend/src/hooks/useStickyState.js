import { useState, useEffect, useRef } from 'react';

/**
 * Deep equality check for values (handles objects and primitives)
 */
function isEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !isEqual(a[key], b[key])) return false;
  }
  return true;
}

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

  // Track if we're the source of the change to avoid self-triggering
  const isLocalUpdate = useRef(false);

  // Persist to localStorage when value changes
  useEffect(() => {
    valueRef.current = value;
    isLocalUpdate.current = true;
    localStorage.setItem(key, JSON.stringify(value));
    // Notify other components
    window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key } }));
    // Reset flag after event loop
    setTimeout(() => { isLocalUpdate.current = false; }, 0);
  }, [key, value]);

  // Listen for changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          if (!isEqual(newValue, valueRef.current)) {
            setValue(newValue);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    const handleLocalChange = (e) => {
      // Skip if we're the source of this change
      if (isLocalUpdate.current) return;

      if (e.detail.key === key) {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          try {
            const newValue = JSON.parse(saved);
            // Only update if value is actually different (deep comparison)
            if (!isEqual(newValue, valueRef.current)) {
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
