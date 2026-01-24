import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PromptConfig from './components/PromptConfig'
import TestCaseList from './pages/TestCaseList'
import TestCaseCreate from './pages/TestCaseCreate'
import TestCaseDetail from './pages/TestCaseDetail'
import TestCaseEdit from './pages/TestCaseEdit'
import ResultsPage from './pages/ResultsPage'
import './App.css'

function App() {
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
        <PromptConfig />
        <main className="main-content">
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
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
