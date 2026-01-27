import './WorkspaceTabs.css'

/**
 * WorkspaceTabs Component
 *
 * Provides tab-based navigation between evaluation workspaces:
 * - Image Eval (lineup extraction from images)
 * - Web Search Eval (lineup extraction from web search)
 */
function WorkspaceTabs({ active, onChange }) {
  return (
    <div className="workspace-tabs" role="tablist" aria-label="Evaluation type">
      <button
        type="button"
        role="tab"
        id="tab-image"
        aria-selected={active === 'image-eval'}
        aria-controls="panel-image"
        className={`workspace-tab ${active === 'image-eval' ? 'active' : ''}`}
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
        className={`workspace-tab ${active === 'web-search-eval' ? 'active' : ''}`}
        onClick={() => onChange('web-search-eval')}
      >
        Web Search Eval
      </button>
    </div>
  )
}

export default WorkspaceTabs
