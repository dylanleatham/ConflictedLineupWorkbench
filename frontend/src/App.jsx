import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStickyState } from './hooks/useStickyState'
import WorkspaceTabs from './components/WorkspaceTabs'
import PromptConfig from './components/PromptConfig'
import TestCaseList from './pages/TestCaseList'
import TestCaseCreate from './pages/TestCaseCreate'
import TestCaseDetail from './pages/TestCaseDetail'
import TestCaseEdit from './pages/TestCaseEdit'
import ResultsPage from './pages/ResultsPage'
import WebSearchTestList from './pages/web-search/TestCaseList'
import WebSearchTestCreate from './pages/web-search/TestCaseCreate'
import WebSearchTestEdit from './pages/web-search/TestCaseEdit'
import './App.css'

function App() {
  // Workspace state - persists active tab selection
  const [activeWorkspace, setActiveWorkspace] = useStickyState(
    'image-eval',
    'active-workspace'
  )

  // Batch results state - lifted to App level for cross-component access
  const [batchResults, setBatchResults] = useState(null)
  const [batchConfig, setBatchConfig] = useState(null)

  // Memoize callback to prevent infinite re-render loop
  const handleBatchComplete = useCallback((results, config) => {
    setBatchResults(results)
    setBatchConfig(config)
  }, [])

  // Determine which panel to show based on workspace
  const isImageEval = activeWorkspace === 'image-eval'

  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <WorkspaceTabs
            active={activeWorkspace}
            onChange={setActiveWorkspace}
          />
          <PromptConfig workspace={activeWorkspace} />
        </aside>
        <main className="main-content">
          <Routes>
            {/* Image Eval routes */}
            <Route
              path="/"
              element={
                <div key={activeWorkspace} className="workspace-panel" role="tabpanel">
                  {isImageEval ? (
                    <TestCaseList onBatchComplete={handleBatchComplete} />
                  ) : (
                    <WebSearchTestList />
                  )}
                </div>
              }
            />
            <Route path="/test-cases/new" element={<TestCaseCreate />} />
            <Route path="/test-cases/:id" element={<TestCaseDetail />} />
            <Route path="/test-cases/:id/edit" element={<TestCaseEdit />} />
            <Route
              path="/results"
              element={
                <ResultsPage
                  batchResults={batchResults}
                  config={batchConfig}
                />
              }
            />
            {/* Web Search Eval routes */}
            <Route path="/web-search/test-cases/new" element={<WebSearchTestCreate />} />
            <Route path="/web-search/test-cases/:id/edit" element={<WebSearchTestEdit />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
