# Phase 5: UI Foundation - Research

**Researched:** 2026-01-26
**Domain:** React tabs, localStorage persistence, independent workspace configuration
**Confidence:** HIGH

## Summary

Phase 5 adds a tabbed interface to switch between Image Eval and Web Search Eval, each with independent system prompt and model configuration. The codebase already has established patterns for localStorage persistence (`useStickyState` hook) and prompt configuration (`PromptConfig` component, `usePromptConfig` hook). The implementation should reuse these patterns with workspace-scoped localStorage keys.

The tab pattern should use a simple controlled component approach (not React Router tabs) since both workspaces share the same sidebar and the content within each tab will have its own routing. This matches React best practices for workspace-style tabs where each tab represents a mode, not a navigable URL.

**Primary recommendation:** Extend the existing `PromptConfig` component to be workspace-aware, using workspace-prefixed localStorage keys (`image-eval:*` and `web-search-eval:*`) to maintain independent configuration state.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI framework | Already in use, native state management sufficient for tabs |
| React Router DOM | 7.12.0 | Routing | Already in use for page navigation within workspaces |
| Vite | 7.2.4 | Build tool | Already in use |

### Supporting (Existing Patterns)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useStickyState` | Custom hook | localStorage persistence with cross-tab sync | Config that persists across sessions |
| `usePromptConfig` | Custom hook | Read-only prompt config access | Components needing current prompt/model |
| Native localStorage | Browser API | Persistence | Direct access when hook overhead not needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tabs component | Headless UI (@headlessui/react) | Adds ~10KB, project uses vanilla CSS, custom is simpler |
| Custom tabs component | Radix UI (@radix-ui/react-tabs) | Adds dependency, accessibility patterns can be hand-implemented |
| localStorage | Zustand persist middleware | Overkill for 2-workspace config, localStorage pattern established |

**Installation:**
```bash
# No new dependencies needed - use existing patterns
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
  App.jsx                    # Add workspace state, pass to PromptConfig + routes
  components/
    PromptConfig.jsx         # Modify to accept workspace prop
    WorkspaceTabs.jsx        # NEW: Tab switcher component
    WebSearchEval/           # NEW: Phase 6-7 will populate
      TestCaseList.jsx       # Placeholder
  hooks/
    useStickyState.js        # REUSE: For workspace-scoped config
    usePromptConfig.js       # MODIFY: Add workspace parameter
    useWorkspace.js          # NEW: Active workspace context
  contexts/
    WorkspaceContext.jsx     # NEW: Workspace state provider
```

### Pattern 1: Workspace-Scoped localStorage Keys
**What:** Prefix localStorage keys with workspace name to maintain independent config
**When to use:** All workspace-specific persistent state
**Example:**
```javascript
// Source: Existing useStickyState pattern extended
// Image eval workspace
const IMAGE_EVAL_PREFIX = 'image-eval:'
const imagePromptKey = `${IMAGE_EVAL_PREFIX}prompt-config`  // 'image-eval:prompt-config'

// Web search eval workspace
const WEB_SEARCH_PREFIX = 'web-search-eval:'
const webSearchPromptKey = `${WEB_SEARCH_PREFIX}prompt-config`  // 'web-search-eval:prompt-config'
```

### Pattern 2: Controlled Tab Component (No Library)
**What:** Simple React state for tab selection without external library
**When to use:** Workspace-style tabs where each tab is a mode, not a URL
**Example:**
```javascript
// Source: React controlled component pattern
function WorkspaceTabs({ activeWorkspace, onWorkspaceChange }) {
  return (
    <div className="workspace-tabs" role="tablist">
      <button
        role="tab"
        aria-selected={activeWorkspace === 'image-eval'}
        className={`tab ${activeWorkspace === 'image-eval' ? 'active' : ''}`}
        onClick={() => onWorkspaceChange('image-eval')}
      >
        Image Eval
      </button>
      <button
        role="tab"
        aria-selected={activeWorkspace === 'web-search-eval'}
        className={`tab ${activeWorkspace === 'web-search-eval' ? 'active' : ''}`}
        onClick={() => onWorkspaceChange('web-search-eval')}
      >
        Web Search Eval
      </button>
    </div>
  )
}
```

### Pattern 3: Workspace Context for Deep Prop Drilling Avoidance
**What:** React Context to provide active workspace to deeply nested components
**When to use:** When workspace affects components more than 2 levels deep
**Example:**
```javascript
// Source: React Context pattern
import { createContext, useContext } from 'react'

const WorkspaceContext = createContext('image-eval')

export function WorkspaceProvider({ children, workspace }) {
  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
```

### Pattern 4: Workspace-Aware Hook Factory
**What:** Parameterize existing hooks to accept workspace
**When to use:** Extending usePromptConfig and similar hooks
**Example:**
```javascript
// Source: Extended from existing usePromptConfig.js
export function usePromptConfig(workspace = 'image-eval') {
  const STORAGE_KEY = `${workspace}:prompt-config`
  // ... rest of hook uses workspace-scoped key
}
```

### Anti-Patterns to Avoid
- **Hard-coded workspace in hooks:** Don't create separate `useImageEvalPromptConfig` and `useWebSearchPromptConfig` - use single parameterized hook
- **URL-based tabs for modes:** Don't use `/image-eval` and `/web-search-eval` routes for tab switching - tabs represent modes, not pages
- **Duplicating PromptConfig component:** Don't copy-paste for web search - parameterize the existing component
- **Global prompt config:** Don't share system prompt between workspaces - each must be independent per requirements

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage sync across tabs | Custom event system | Existing `useStickyState` hook | Already implements storage events + custom events for same-tab sync |
| Prompt config persistence | New persistence layer | Extend existing `PromptConfig` pattern | Maintains consistency, leverages proven debounced save |
| Tab keyboard navigation | Custom key handlers | ARIA roles + native button behavior | Buttons with role="tab" get keyboard navigation free |
| Workspace state | Redux/Zustand | React useState + Context | Only 2 workspaces, 1 active at a time - minimal state |

**Key insight:** The v1.0 codebase already solved localStorage persistence patterns. Phase 5 extends these patterns with workspace prefixes rather than building new infrastructure.

## Common Pitfalls

### Pitfall 1: localStorage Key Collision
**What goes wrong:** Using same keys for both workspaces overwrites image eval config when web search eval saves
**Why it happens:** Copy-paste from existing code without changing storage keys
**How to avoid:** Define workspace prefix constants, use template literals: `${workspace}:prompt-config`
**Warning signs:** Switching tabs causes config to change unexpectedly

### Pitfall 2: Stale Closure in Event Listeners
**What goes wrong:** Storage event handlers capture stale workspace value
**Why it happens:** Event listener registered once, workspace changes later
**How to avoid:** Include workspace in useEffect dependency array, or use ref for current workspace
**Warning signs:** Wrong workspace's config updates when localStorage changes

### Pitfall 3: Backend API Conflict
**What goes wrong:** Both workspaces try to POST to same `/api/prompt-config` endpoint
**Why it happens:** v1.0 backend has single prompt config, not workspace-scoped
**How to avoid:** For Phase 5, use localStorage-only for web search config (WSUI-04 explicitly says localStorage). Consider backend extension in future phase.
**Warning signs:** Web search config overwrites image eval config in backend

### Pitfall 4: Tab State Not Persisted
**What goes wrong:** User refreshes page, loses tab selection
**Why it happens:** Tab state stored in useState, not persisted
**How to avoid:** Use `useStickyState` for activeWorkspace: `useStickyState('image-eval', 'active-workspace')`
**Warning signs:** Always starts on Image Eval tab after refresh

### Pitfall 5: Missing Accessibility
**What goes wrong:** Tab interface not keyboard navigable
**Why it happens:** Using divs instead of buttons, missing ARIA attributes
**How to avoid:** Use `<button>` elements, add `role="tablist"`, `role="tab"`, `aria-selected`
**Warning signs:** Cannot tab to controls, screen reader doesn't announce tabs

## Code Examples

Verified patterns from official sources and existing codebase:

### Workspace-Scoped useStickyState Usage
```javascript
// Source: Existing useStickyState.js pattern
import { useStickyState } from '../hooks/useStickyState'

function PromptConfig({ workspace }) {
  // Key includes workspace prefix
  const [systemPrompt, setSystemPrompt] = useStickyState(
    DEFAULT_SYSTEM_PROMPT,
    `${workspace}:system-prompt`
  )
  const [claudeModel, setClaudeModel] = useStickyState(
    DEFAULT_MODEL,
    `${workspace}:claude-model`
  )
  // ... render UI
}
```

### Tab Component with ARIA
```javascript
// Source: WAI-ARIA Authoring Practices (tabs pattern)
function WorkspaceTabs({ active, onChange }) {
  return (
    <div className="workspace-tabs" role="tablist" aria-label="Evaluation type">
      <button
        type="button"
        role="tab"
        id="tab-image"
        aria-selected={active === 'image-eval'}
        aria-controls="panel-image"
        onClick={() => onChange('image-eval')}
      >
        Image Eval
      </button>
      <button
        type="button"
        role="tab"
        id="tab-web-search"
        aria-selected={active === 'web-search-eval'}
        aria-controls="panel-web-search"
        onClick={() => onChange('web-search-eval')}
      >
        Web Search Eval
      </button>
    </div>
  )
}
```

### App.jsx Workspace Integration
```javascript
// Source: Extended from existing App.jsx
import { useStickyState } from './hooks/useStickyState'

function App() {
  // Workspace state persisted to localStorage
  const [activeWorkspace, setActiveWorkspace] = useStickyState(
    'image-eval',
    'active-workspace'
  )

  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside>
          <WorkspaceTabs
            active={activeWorkspace}
            onChange={setActiveWorkspace}
          />
          <PromptConfig workspace={activeWorkspace} />
        </aside>
        <main className="main-content">
          {activeWorkspace === 'image-eval' ? (
            <ImageEvalRoutes />
          ) : (
            <WebSearchEvalRoutes />
          )}
        </main>
      </div>
    </BrowserRouter>
  )
}
```

### localStorage Key Constants
```javascript
// Source: Best practice - centralize storage keys
// hooks/storageKeys.js
export const STORAGE_KEYS = {
  ACTIVE_WORKSPACE: 'active-workspace',
  imageEval: {
    PROMPT_CONFIG: 'image-eval:prompt-config',
    SYSTEM_PROMPT: 'image-eval:system-prompt',
    CLAUDE_MODEL: 'image-eval:claude-model',
  },
  webSearchEval: {
    PROMPT_CONFIG: 'web-search-eval:prompt-config',
    SYSTEM_PROMPT: 'web-search-eval:system-prompt',
    CLAUDE_MODEL: 'web-search-eval:claude-model',
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate components per workspace | Single parameterized component | React 16.8+ (hooks) | Eliminates duplication |
| Redux for tab state | useState/useContext | React 18+ (concurrent) | Simpler, no external dep |
| CSS classes for active tab | ARIA attributes + CSS | WCAG 2.1 (2018) | Better accessibility |
| Inline styles for tabs | CSS classes | Project convention | Consistency with existing code |

**Deprecated/outdated:**
- Tab libraries for 2-tab UIs: Overhead not justified for simple use case
- React Router tabs for mode switching: Adds unnecessary URL complexity

## Open Questions

Things that couldn't be fully resolved:

1. **Backend API for web search config**
   - What we know: WSUI-04 specifies localStorage, not backend
   - What's unclear: Should web search config eventually sync to backend like image eval?
   - Recommendation: Use localStorage-only for Phase 5. If backend needed later, extend `/api/prompt-config` to accept workspace parameter.

2. **Navigation within web search workspace**
   - What we know: Phase 6-7 will add test case CRUD and results for web search
   - What's unclear: Should web search workspace have same route structure as image eval?
   - Recommendation: Mirror image eval routes under web search workspace (e.g., test case list, create, edit, results).

3. **Default system prompt for web search**
   - What we know: Image eval default is "Extract the festival lineup from this image. Return a JSON array of artist names."
   - What's unclear: What should web search default be?
   - Recommendation: Use similar structure: "Search for the {festival} {year} lineup and return the artist names as a JSON array." User can customize.

## Sources

### Primary (HIGH confidence)
- Existing codebase (`PromptConfig.jsx`, `useStickyState.js`, `usePromptConfig.js`) - Verified patterns
- React 19 documentation (reactjs.org) - Hooks, Context patterns
- WAI-ARIA Authoring Practices (w3.org) - Tab accessibility patterns

### Secondary (MEDIUM confidence)
- Project STACK.md research document - Verified technology choices

### Tertiary (LOW confidence)
- None required - implementation uses established codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture: HIGH - Extending established patterns in codebase
- Pitfalls: HIGH - Based on codebase analysis and common React patterns

**Research date:** 2026-01-26
**Valid until:** 60 days (stable patterns, no external dependencies)
