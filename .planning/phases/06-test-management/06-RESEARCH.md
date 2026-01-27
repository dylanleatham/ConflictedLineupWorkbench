# Phase 6: Test Management - Research

**Researched:** 2026-01-26
**Domain:** React CRUD with localStorage persistence
**Confidence:** HIGH

## Summary

Phase 6 implements CRUD operations for web search test cases using React patterns and localStorage for persistence. The codebase already has mature patterns for test case management (image eval) that can be adapted for web search test cases with localStorage-only persistence.

Key findings:
- Existing codebase uses React Router v7.12.0 in declarative mode with controlled components and inline styles
- useStickyState hook already implements robust localStorage sync with cross-tab support
- Test case structure is simple: festival name, year, and ground truth lineup (array of strings)
- No backend integration needed - localStorage only (backend sync deferred to future phases)

The standard approach is to mirror existing image eval patterns (TestCaseList, TestCaseCreate, TestCaseEdit) but use localStorage via useStickyState instead of backend API calls. This provides consistency with the codebase while meeting the "localStorage only" constraint from Phase 5.

**Primary recommendation:** Reuse existing component patterns and routing structure, replace backend API calls with localStorage operations via useStickyState hook, implement crypto.randomUUID() for test case IDs.

## Standard Stack

The project has established stack from v1.0. Phase 6 reuses existing patterns.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI framework | Project standard |
| React Router DOM | 7.12.0 | Client-side routing | Project standard |
| Vite | 7.2.4 | Build tool | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | No new dependencies | localStorage is built-in |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage | IndexedDB | localStorage sufficient for ~10-50 test cases; IndexedDB adds complexity for minimal benefit at this scale |
| crypto.randomUUID() | uuid npm package | Built-in API works in secure context (localhost), no dependency needed |
| useStickyState | Custom hook | useStickyState already handles sync/JSON/errors - don't reinvent |

**Installation:**
No new dependencies required - use existing stack.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── pages/
│   ├── web-search/              # NEW: Web search test case pages
│   │   ├── TestCaseList.jsx     # List view with create/delete
│   │   ├── TestCaseCreate.jsx   # Create form
│   │   └── TestCaseEdit.jsx     # Edit form
├── hooks/
│   ├── useStickyState.js        # EXISTING: Reuse for localStorage
│   └── useWebSearchTests.js     # NEW: Hook for test case state
├── App.jsx                       # EXISTING: Add routes for web search pages
```

### Pattern 1: localStorage-Only CRUD with useStickyState

**What:** Manage test cases entirely in localStorage without backend API calls
**When to use:** Phase 6 requirement - localStorage only, backend sync in Phase 6-7

**Example:**
```javascript
// Source: Existing codebase pattern - frontend/src/hooks/useStickyState.js
import { useStickyState } from '../hooks/useStickyState';

function useWebSearchTests() {
  const [tests, setTests] = useStickyState([], 'web-search-eval:test-cases');

  const createTest = (name, year, lineup) => {
    const id = crypto.randomUUID();
    const newTest = { id, name, year, lineup };
    setTests([...tests, newTest]);
    return newTest;
  };

  const updateTest = (id, updates) => {
    setTests(tests.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTest = (id) => {
    setTests(tests.filter(t => t.id !== id));
  };

  return { tests, createTest, updateTest, deleteTest };
}
```

### Pattern 2: Controlled Form Components with Validation

**What:** Use controlled components (value + onChange) with inline validation
**When to use:** All form inputs for create/edit

**Example:**
```javascript
// Source: Existing pattern - frontend/src/pages/TestCaseCreate.jsx
const [name, setName] = useState('');
const [year, setYear] = useState('');
const [lineup, setLineup] = useState('');

const validateForm = () => {
  if (!name.trim()) {
    setError('Festival name is required');
    return false;
  }
  if (!year.trim() || !/^\d{4}$/.test(year)) {
    setError('Year must be a 4-digit number');
    return false;
  }
  const artists = parseLineup(lineup);
  if (artists.length === 0) {
    setError('At least one artist is required');
    return false;
  }
  return true;
};
```

### Pattern 3: React Router Declarative Routing

**What:** Use Routes and Route components for page navigation
**When to use:** Adding web search test case pages to existing router

**Example:**
```javascript
// Source: React Router v7 best practices - https://reactrouter.com/
<Routes>
  <Route path="/web-search/test-cases" element={<TestCaseList />} />
  <Route path="/web-search/test-cases/new" element={<TestCaseCreate />} />
  <Route path="/web-search/test-cases/:id" element={<TestCaseDetail />} />
  <Route path="/web-search/test-cases/:id/edit" element={<TestCaseEdit />} />
</Routes>
```

### Pattern 4: Array Sorting in State

**What:** Sort test cases by year descending using JavaScript array sort
**When to use:** Displaying test list with most recent first

**Example:**
```javascript
// Source: JavaScript standard - MDN Array.prototype.sort()
const sortedTests = [...tests].sort((a, b) => {
  // Sort by year descending (most recent first)
  return parseInt(b.year) - parseInt(a.year);
});
```

### Anti-Patterns to Avoid

- **Mixing localStorage and backend calls:** Phase 6 is localStorage-only; don't add backend API calls
- **Mutating state directly:** Always use setTests([...tests, newItem]) not tests.push(newItem)
- **Using Math.random() for IDs:** Use crypto.randomUUID() for cryptographically secure unique IDs
- **Storing functions in localStorage:** localStorage can only store strings - serialize objects with JSON.stringify/parse

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage sync across tabs | Custom storage event listener | useStickyState hook (existing) | Already handles cross-tab sync, JSON parsing, error handling |
| UUID generation | Custom timestamp+random | crypto.randomUUID() | Cryptographically secure, RFC4122 compliant, built-in |
| Form state management | Redux or complex state | useState + controlled components | Simple forms don't need global state |
| Newline parsing | Complex regex | String.split('\n').map(trim).filter | Standard JS is sufficient for one-artist-per-line |

**Key insight:** The codebase already has robust patterns for test case CRUD - adapt existing components rather than building from scratch. useStickyState handles all localStorage complexity.

## Common Pitfalls

### Pitfall 1: localStorage Quota Exceeded Errors

**What goes wrong:** localStorage has ~5-10MB limit per origin; large test cases can exceed quota
**Why it happens:** Storing large lineups or many test cases without quota checking
**How to avoid:** Wrap localStorage operations in try-catch, handle QuotaExceededError gracefully
**Warning signs:** DOMException with error name "QuotaExceededError" or code 22

**Example:**
```javascript
// Source: https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
try {
  localStorage.setItem(key, JSON.stringify(value));
} catch (error) {
  if (error.name === 'QuotaExceededError' || error.code === 22) {
    console.error('localStorage quota exceeded');
    // Fallback: show error to user, don't save
  }
}
```

### Pitfall 2: JSON Parsing Errors from Corrupted localStorage

**What goes wrong:** localStorage data gets corrupted (user manually edits, browser bug)
**Why it happens:** Direct localStorage.getItem without JSON.parse error handling
**How to avoid:** useStickyState already handles this with try-catch; don't bypass it
**Warning signs:** SyntaxError: Unexpected token in JSON at position X

### Pitfall 3: State Update Race Conditions

**What goes wrong:** Multiple updates to test cases array can overwrite each other
**Why it happens:** Using stale state in callbacks: setTests(tests.filter(...)) instead of functional updates
**How to avoid:** Use functional updates when state depends on previous state
**Warning signs:** Deletes/updates that don't persist or randomly fail

**Example:**
```javascript
// BAD: Uses stale state
const deleteTest = (id) => {
  setTests(tests.filter(t => t.id !== id));
};

// GOOD: Functional update
const deleteTest = (id) => {
  setTests(prevTests => prevTests.filter(t => t.id !== id));
};
```

### Pitfall 4: Not Handling Missing Test Case on Edit

**What goes wrong:** User bookmarks edit page, test case gets deleted, page crashes
**Why it happens:** No null check when loading test case by ID
**How to avoid:** Check if test case exists, show error state if not found
**Warning signs:** TypeError: Cannot read properties of undefined

## Code Examples

Verified patterns from official sources and existing codebase:

### Create Test Case (localStorage pattern)

```javascript
// Adapted from existing TestCaseCreate.jsx pattern
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStickyState } from '../hooks/useStickyState';

function WebSearchTestCaseCreate() {
  const navigate = useNavigate();
  const [tests, setTests] = useStickyState([], 'web-search-eval:test-cases');

  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [lineup, setLineup] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseLineup = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim() || !year.trim() || parseLineup(lineup).length === 0) {
      setError('All fields are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const id = crypto.randomUUID();
      const newTest = {
        id,
        name: name.trim(),
        year: year.trim(),
        lineup: parseLineup(lineup)
      };

      setTests([...tests, newTest]);
      navigate(`/web-search/test-cases/${id}`);
    } catch (err) {
      setError('Failed to create test case');
      setIsSubmitting(false);
    }
  };

  // ... render form
}
```

### List Test Cases with Sorting

```javascript
// Pattern: Sort by year descending
import { useStickyState } from '../hooks/useStickyState';

function WebSearchTestCaseList() {
  const [tests] = useStickyState([], 'web-search-eval:test-cases');

  // Sort by year descending (most recent first)
  const sortedTests = [...tests].sort((a, b) => {
    return parseInt(b.year) - parseInt(a.year);
  });

  return (
    <div>
      {sortedTests.length === 0 ? (
        <div className="empty-state">
          <p>No test cases yet</p>
          <Link to="/web-search/test-cases/new">Create Test Case</Link>
        </div>
      ) : (
        sortedTests.map(test => (
          <div key={test.id}>
            <h3>{test.name}</h3>
            <p>Year: {test.year}</p>
            <p>Artists: {test.lineup.length}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

### Delete with Confirmation

```javascript
// Pattern: Inline confirmation with window.confirm (simple approach)
const handleDelete = (id, name) => {
  if (window.confirm(`Delete test case "${name}"?`)) {
    setTests(prevTests => prevTests.filter(t => t.id !== id));
  }
};

// Alternative: Modal-based confirmation (more accessible)
const [deleteTarget, setDeleteTarget] = useState(null);

const handleDeleteClick = (test) => {
  setDeleteTarget(test);
};

const confirmDelete = () => {
  if (deleteTarget) {
    setTests(prevTests => prevTests.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }
};

// Render modal when deleteTarget is set
{deleteTarget && (
  <div className="modal" role="alertdialog" aria-labelledby="delete-title">
    <h2 id="delete-title">Delete Test Case?</h2>
    <p>Are you sure you want to delete "{deleteTarget.name}"?</p>
    <button onClick={confirmDelete}>Delete</button>
    <button onClick={() => setDeleteTarget(null)}>Cancel</button>
  </div>
)}
```

### Edit Test Case (Pre-fill Form)

```javascript
// Pattern: Load from localStorage and pre-fill form
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStickyState } from '../hooks/useStickyState';

function WebSearchTestCaseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useStickyState([], 'web-search-eval:test-cases');

  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [lineup, setLineup] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const test = tests.find(t => t.id === id);
    if (!test) {
      setError('Test case not found');
      setIsLoading(false);
      return;
    }

    setName(test.name);
    setYear(test.year);
    setLineup(test.lineup.join('\n'));
    setIsLoading(false);
  }, [id, tests]);

  const handleSubmit = (e) => {
    e.preventDefault();

    setTests(prevTests => prevTests.map(t =>
      t.id === id
        ? { ...t, name: name.trim(), year: year.trim(), lineup: parseLineup(lineup) }
        : t
    ));

    navigate(`/web-search/test-cases/${id}`);
  };

  // ... render form
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class components | Functional components + hooks | React 16.8 (2019) | useStickyState uses hooks |
| Math.random() for IDs | crypto.randomUUID() | Widely available 2021+ | Cryptographically secure IDs |
| Redux for all state | useState for local, Context for shared | React 16.3+ | Simpler state for forms |
| React Router v6 | React Router v7 | 2024 | Declarative mode still works, no breaking changes |

**Deprecated/outdated:**
- componentDidMount/componentWillUnmount: Use useEffect instead
- Math.random() for UUIDs: Use crypto.randomUUID()
- window.localStorage direct access: Wrap in useStickyState for sync/error handling

## Open Questions

Things that couldn't be fully resolved:

1. **Delete confirmation UX approach**
   - What we know: Two viable options - window.confirm (simple) or modal dialog (accessible)
   - What's unclear: User preference for UX pattern
   - Recommendation: Start with window.confirm (matches existing simplicity), upgrade to modal if accessibility concerns arise

2. **localStorage key naming convention**
   - What we know: Existing pattern uses 'web-search-eval:prompt-config'
   - What's unclear: Should test cases use 'web-search-eval:test-cases' or 'web-search-eval:tests'
   - Recommendation: Use 'web-search-eval:test-cases' for consistency with backend naming

3. **Test case ID collision handling**
   - What we know: crypto.randomUUID() is collision-resistant but not impossible
   - What's unclear: Should we check for ID uniqueness before adding?
   - Recommendation: No - UUID v4 collision probability is negligible (1 in 2^122)

## Sources

### Primary (HIGH confidence)
- React Router v7 official documentation - https://reactrouter.com/
- MDN Web Crypto API (randomUUID) - https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
- Existing codebase patterns - frontend/src/hooks/useStickyState.js, frontend/src/pages/TestCaseCreate.jsx, frontend/src/pages/TestCaseEdit.jsx
- package.json dependencies - React 19.2.0, React Router DOM 7.12.0

### Secondary (MEDIUM confidence)
- LogRocket: Using localStorage with React Hooks - https://blog.logrocket.com/using-localstorage-react-hooks/
- Medium: Mastering State Persistence with Local Storage in React - https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c
- Matteo Mazzarolo: Handling localStorage errors - https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
- Material UI Dialog: Accessibility patterns - https://mui.com/material-ui/react-dialog/
- MDN: Storage quotas and eviction criteria - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

### Tertiary (LOW confidence)
- WebSearch results on React patterns - various blog posts and tutorials (verified against codebase and official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly from package.json and existing code
- Architecture: HIGH - patterns verified in existing codebase (v1.0 shipped successfully)
- Pitfalls: MEDIUM - localStorage pitfalls are well-documented but specific edge cases depend on usage

**Research date:** 2026-01-26
**Valid until:** 60 days (stable APIs - React, localStorage, crypto.randomUUID() are mature)
