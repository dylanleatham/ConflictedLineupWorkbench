import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom'
import { useStickyState } from './hooks/useStickyState'
import WorkspaceTabs from './components/WorkspaceTabs'
import ViewTabs from './components/ViewTabs'
import PromptConfig from './components/PromptConfig'
import TestCaseList from './pages/TestCaseList'
import TestCaseCreate from './pages/TestCaseCreate'
import TestCaseEdit from './pages/TestCaseEdit'
import ResultsPage from './pages/ResultsPage'
import TestCaseResultDetail from './pages/TestCaseResultDetail'
import WebSearchTestList from './pages/web-search/TestCaseList'
import WebSearchTestCreate from './pages/web-search/TestCaseCreate'
import WebSearchTestEdit from './pages/web-search/TestCaseEdit'
import WebSearchResultsPage from './pages/web-search/ResultsPage'
import './App.css'

// Redirect component for legacy detail view URLs
function TestCaseRedirect() {
  const { id } = useParams()
  return <Navigate to={`/test-cases/${id}/results`} replace />
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()

  // Workspace state - persists active tab selection
  const [activeWorkspace, setActiveWorkspace] = useStickyState(
    'image-eval',
    'active-workspace'
  )

  // Sync workspace state based on URL when navigating directly
  useEffect(() => {
    const isWebSearchRoute = location.pathname.startsWith('/web-search')
    const expectedWorkspace = isWebSearchRoute ? 'web-search-eval' : 'image-eval'
    if (activeWorkspace !== expectedWorkspace) {
      setActiveWorkspace(expectedWorkspace)
    }
  }, [location.pathname, activeWorkspace, setActiveWorkspace])

  // Image Eval batch results state - lifted to App level for cross-component access
  const [batchResults, setBatchResults] = useState(null)
  const [batchConfig, setBatchConfig] = useState(null)

  // Web Search Eval batch results state
  const [webSearchResults, setWebSearchResults] = useState(null)

  // Memoize callback to prevent infinite re-render loop
  const handleBatchComplete = useCallback((results, config) => {
    setBatchResults(results)
    setBatchConfig(config)
  }, [])

  const handleWebSearchBatchComplete = useCallback((results) => {
    setWebSearchResults(results)
  }, [])

  // Handle workspace change - update state and navigate to list
  const handleWorkspaceChange = useCallback((workspace) => {
    setActiveWorkspace(workspace)
    // Navigate to the appropriate list view
    if (workspace === 'image-eval') {
      navigate('/')
    } else {
      navigate('/web-search')
    }
  }, [setActiveWorkspace, navigate])

  return (
    <div className="app-container">
      <header className="app-ribbon">
        <WorkspaceTabs
          active={activeWorkspace}
          onChange={handleWorkspaceChange}
        />
      </header>
      <div className="app-layout">
        <aside className="sidebar">
          <PromptConfig workspace={activeWorkspace} />
        </aside>
        <main className="main-content">
          <Routes>
            {/* Image Eval routes */}
            <Route
              path="/"
              element={
                <div className="workspace-panel" role="tabpanel">
                  <ViewTabs basePath="" />
                  <TestCaseList onBatchComplete={handleBatchComplete} />
                </div>
              }
            />
            <Route
              path="/results"
              element={
                <div className="workspace-panel" role="tabpanel">
                  <ViewTabs basePath="" />
                  <ResultsPage
                    batchResults={batchResults}
                    config={batchConfig}
                  />
                </div>
              }
            />
            <Route path="/test-cases/new" element={<TestCaseCreate />} />
            <Route path="/test-cases/:id" element={<TestCaseRedirect />} />
            <Route path="/test-cases/:id/results" element={<TestCaseResultDetail />} />
            <Route path="/test-cases/:id/edit" element={<TestCaseEdit />} />
            {/* Web Search Eval routes */}
            <Route
              path="/web-search"
              element={
                <div className="workspace-panel" role="tabpanel">
                  <ViewTabs basePath="/web-search" />
                  <WebSearchTestList onBatchComplete={handleWebSearchBatchComplete} />
                </div>
              }
            />
            <Route
              path="/web-search/results"
              element={
                <div className="workspace-panel" role="tabpanel">
                  <ViewTabs basePath="/web-search" />
                  <WebSearchResultsPage batchResults={webSearchResults} />
                </div>
              }
            />
            <Route path="/web-search/test-cases/new" element={<WebSearchTestCreate />} />
            <Route path="/web-search/test-cases/:id/results" element={<TestCaseResultDetail />} />
            <Route path="/web-search/test-cases/:id/edit" element={<WebSearchTestEdit />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
