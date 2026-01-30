import { exportBatchResults } from '../utils/export'
import ResultsTable from '../components/ResultsTable'

function ResultsPage({ batchResults, config }) {
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

  // Results view - batch results exist
  const handleExport = () => {
    exportBatchResults(batchResults, config)
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px'
    }}>
      {/* Results table with integrated summary and export */}
      <ResultsTable results={batchResults} onExport={handleExport} />
    </div>
  )
}

export default ResultsPage
