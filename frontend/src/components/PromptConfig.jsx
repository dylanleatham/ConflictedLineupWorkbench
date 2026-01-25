import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPromptConfig, savePromptConfig } from '../api/prompts';
import './PromptConfig.css';

const DEFAULT_SYSTEM_PROMPT = 'Extract the festival lineup from this image. Return a JSON array of artist names.';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// Storage key for cross-component sync
const STORAGE_EVENT_KEY = 'festival-evaluator:prompt-config';

/**
 * Prompt Configuration Panel
 *
 * Allows users to configure:
 * - System prompt for Claude API
 * - Claude model selection
 *
 * Values persist to backend storage and sync across browser tabs/components.
 */
function PromptConfig() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [claudeModel, setClaudeModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Load config from backend on mount
  useEffect(() => {
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
  }, []);

  // Debounced save to backend
  const saveToBackend = useCallback(async (prompt, model) => {
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
  }, []);

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
    setSystemPrompt(newPrompt);
    scheduleSave(newPrompt, claudeModel);
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setClaudeModel(newModel);
    // Model changes save immediately (no debounce needed for dropdowns)
    saveToBackend(systemPrompt, newModel);
  };

  if (loading) {
    return (
      <aside className="prompt-config">
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Test Cases</Link>
          <Link to="/results" style={styles.navLink}>Results</Link>
        </nav>
        <h2>Prompt Configuration</h2>
        <p>Loading...</p>
      </aside>
    );
  }

  return (
    <aside className="prompt-config">
      <nav style={styles.nav}>
        <Link to="/" style={styles.navLink}>Test Cases</Link>
        <Link to="/results" style={styles.navLink}>Results</Link>
      </nav>

      <h2>
        Prompt Configuration
        {saving && <span style={styles.savingIndicator}> (saving...)</span>}
      </h2>

      <div className="form-group">
        <label htmlFor="system-prompt">System Prompt</label>
        <textarea
          id="system-prompt"
          value={systemPrompt}
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
          value={claudeModel}
          onChange={handleModelChange}
          className="model-select"
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
          <option value="claude-opus-4-20250514">Claude Opus 4</option>
          <option value="claude-opus-4-5-20250115">Claude Opus 4.5</option>
          <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
        </select>
      </div>
    </aside>
  );
}

const styles = {
  nav: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #ddd'
  },
  navLink: {
    display: 'block',
    padding: '8px 0',
    color: '#007bff',
    textDecoration: 'none'
  },
  savingIndicator: {
    fontSize: '0.75em',
    color: '#666',
    fontWeight: 'normal'
  }
}

export default PromptConfig;
