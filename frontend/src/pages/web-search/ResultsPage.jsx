import { useState, useEffect } from 'react'
import { getTestCases } from '../../api/testCases'
import WebSearchResultsTable from '../../components/WebSearchResultsTable'
import { exportWebSearchResults } from '../../utils/webSearchExport'
import { useStickyState } from '../../hooks/useStickyState'

// Default config matching PromptConfig.jsx defaults for web-search-eval
const DEFAULT_CONFIG = {
  system_prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
  claude_model: 'claude-sonnet-4-20250514'
}

function WebSearchResultsPage({ batchResults }) {
  const [tests, setTests] = useState([])
  const [wsConfig] = useStickyState(DEFAULT_CONFIG, 'web-search-eval:prompt-config')

  useEffect(() => {
    getTestCases().then(setTests).catch(() => {})
  }, [])

  const handleExport = () => {
    if (!batchResults) return
    exportWebSearchResults(batchResults, {
      system_prompt: wsConfig.system_prompt,
      model: wsConfig.claude_model
    })
  }

  // Empty state - no results yet
  if (!batchResults) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          marginBottom: '12px',
          color: '#333'
        }}>
          No results yet
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#666'
        }}>
          Run a batch test from the Test Cases tab to see results here
        </p>
      </div>
    )
  }

  // Results view
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <WebSearchResultsTable
        results={batchResults}
        tests={tests}
        onExport={handleExport}
      />
    </div>
  )
}

export default WebSearchResultsPage
