import { useState, useEffect, useRef, useCallback } from 'react';
import { getPromptConfig, savePromptConfig } from '../api/prompts';
import { useStickyState } from '../hooks/useStickyState';
import './PromptConfig.css';

// Workspace-specific defaults
const DEFAULTS = {
  'image-eval': {
    prompt: 'Extract the festival lineup from this image. Return a JSON array of artist names.',
    model: 'claude-sonnet-4-20250514'
  },
  'web-search-eval': {
    prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
    model: 'claude-sonnet-4-20250514'
  }
};

// Storage key for cross-component sync (image-eval only)
const STORAGE_EVENT_KEY = 'festival-evaluator:prompt-config';

/**
 * Prompt Configuration Panel
 *
 * Allows users to configure:
 * - System prompt for Claude API
 * - Claude model selection
 *
 * Image Eval: Values persist to backend storage and sync across browser tabs/components.
 * Web Search Eval: Values persist to localStorage only (backend sync in Phase 6).
 */
function PromptConfig({ workspace = 'image-eval' }) {
  // Web Search Eval: Use localStorage only
  const [webSearchConfig, setWebSearchConfig] = useStickyState(
    {
      system_prompt: DEFAULTS['web-search-eval'].prompt,
      claude_model: DEFAULTS['web-search-eval'].model
    },
    'web-search-eval:prompt-config'
  );

  // Image Eval: Use backend sync (existing pattern)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULTS['image-eval'].prompt);
  const [claudeModel, setClaudeModel] = useState(DEFAULTS['image-eval'].model);
  const [loading, setLoading] = useState(workspace === 'image-eval');
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Load config from backend on mount (image-eval only)
  useEffect(() => {
    if (workspace !== 'image-eval') return;

    let mounted = true;

    async function loadConfig() {
      try {
        const config = await getPromptConfig();
        if (mounted) {
          setSystemPrompt(config.system_prompt);
          setClaudeModel(config.claude_model);
          // Also update localStorage for other components to read
          localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(config));
        }
      } catch (err) {
        console.error('Failed to load prompt config:', err);
        // Fall back to defaults on error
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [workspace]);

  // Debounced save to backend (image-eval only)
  const saveToBackend = useCallback(async (prompt, model) => {
    if (workspace !== 'image-eval') return;

    setSaving(true);
    try {
      const config = { system_prompt: prompt, claude_model: model };
      await savePromptConfig(config);
      // Update localStorage for cross-component sync
      localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(config));
      // Dispatch custom event for same-tab sync
      window.dispatchEvent(new CustomEvent('local-storage-change', {
        detail: { key: STORAGE_EVENT_KEY }
      }));
    } catch (err) {
      console.error('Failed to save prompt config:', err);
    } finally {
      setSaving(false);
    }
  }, [workspace]);

  // Schedule save after user stops typing (500ms debounce)
  const scheduleSave = useCallback((prompt, model) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToBackend(prompt, model);
    }, 500);
  }, [saveToBackend]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    if (workspace === 'web-search-eval') {
      setWebSearchConfig({ ...webSearchConfig, system_prompt: newPrompt });
    } else {
      setSystemPrompt(newPrompt);
      scheduleSave(newPrompt, claudeModel);
    }
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    if (workspace === 'web-search-eval') {
      setWebSearchConfig({ ...webSearchConfig, claude_model: newModel });
    } else {
      setClaudeModel(newModel);
      // Model changes save immediately (no debounce needed for dropdowns)
      saveToBackend(systemPrompt, newModel);
    }
  };

  // Get current values based on workspace
  const currentPrompt = workspace === 'web-search-eval'
    ? webSearchConfig.system_prompt
    : systemPrompt;
  const currentModel = workspace === 'web-search-eval'
    ? webSearchConfig.claude_model
    : claudeModel;

  if (loading) {
    return (
      <div className="prompt-config">
        <h2>Prompt Configuration</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="prompt-config">
      <h2>
        Prompt Configuration
        {saving && <span style={styles.savingIndicator}> (saving...)</span>}
      </h2>

      <div className="form-group">
        <label htmlFor="system-prompt">System Prompt</label>
        <textarea
          id="system-prompt"
          value={currentPrompt}
          onChange={handlePromptChange}
          rows={10}
          placeholder="Enter your system prompt..."
          className="system-prompt-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="claude-model">Claude Model</label>
        <select
          id="claude-model"
          value={currentModel}
          onChange={handleModelChange}
          className="model-select"
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
          <option value="claude-opus-4-20250514">Claude Opus 4</option>
          <option value="claude-opus-4-5-20250115">Claude Opus 4.5</option>
          <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
        </select>
      </div>
    </div>
  );
}

const styles = {
  savingIndicator: {
    fontSize: '0.75em',
    color: '#666',
    fontWeight: 'normal'
  }
}

export default PromptConfig;
