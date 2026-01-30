import { NavLink } from 'react-router-dom'
import './ViewTabs.css'

/**
 * ViewTabs Component
 *
 * Sub-navigation tabs for switching between Test Cases and Results views.
 * Used by both Image Eval and Web Search Eval workspaces.
 */
function ViewTabs({ basePath = '' }) {
  const testCasesPath = basePath || '/'
  const resultsPath = basePath ? `${basePath}/results` : '/results'

  return (
    <nav className="view-tabs" aria-label="View navigation">
      <NavLink
        to={testCasesPath}
        end
        className={({ isActive }) => `view-tab ${isActive ? 'active' : ''}`}
      >
        Test Cases
      </NavLink>
      <NavLink
        to={resultsPath}
        className={({ isActive }) => `view-tab ${isActive ? 'active' : ''}`}
      >
        Results
      </NavLink>
    </nav>
  )
}

export default ViewTabs
