import { Link } from 'react-router-dom';
import { useStickyState } from '../hooks/useStickyState';
import './PromptConfig.css';

/**
 * Prompt Configuration Panel
 *
 * Allows users to configure:
 * - System prompt for Claude API
 * - Claude model selection
 *
 * Values persist to localStorage between sessions.
 */
function PromptConfig() {
  const [systemPrompt, setSystemPrompt] = useStickyState(
    'Extract the festival lineup from this image. Return a JSON array of artist names.',
    'festival-evaluator:system-prompt'
  );

  const [claudeModel, setClaudeModel] = useStickyState(
    'claude-sonnet-4-20250514',
    'festival-evaluator:claude-model'
  );

  return (
    <aside className="prompt-config">
      <nav style={styles.nav}>
        <Link to="/" style={styles.navLink}>Test Cases</Link>
        <Link to="/results" style={styles.navLink}>Results</Link>
      </nav>

      <h2>Prompt Configuration</h2>

      <div className="form-group">
        <label htmlFor="system-prompt">System Prompt</label>
        <textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
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
          onChange={(e) => setClaudeModel(e.target.value)}
          className="model-select"
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
          <option value="claude-opus-4-20250514">Claude Opus 4</option>
          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
          <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
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
  }
}

export default PromptConfig;
