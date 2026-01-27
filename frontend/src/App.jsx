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
          {activeWorkspace === 'image-eval' ? (
            <div id="panel-image" role="tabpanel" aria-labelledby="tab-image">
              <Routes>
                <Route
                  path="/"
                  element={
                    <TestCaseList
                      onBatchComplete={handleBatchComplete}
                    />
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
              </Routes>
            </div>
          ) : (
            <div id="panel-web-search" role="tabpanel" aria-labelledby="tab-web-search">
              <div style={{ padding: '2rem' }}>
                <h1>Web Search Eval</h1>
                <p style={{ color: '#666' }}>Coming in Phase 6</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
