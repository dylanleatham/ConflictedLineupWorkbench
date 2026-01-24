import { Link } from 'react-router-dom'
import { exportBatchResults } from '../utils/export'

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
          color: '#666',
          marginBottom: '24px'
        }}>
          Run a batch test to see results here
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Go to Test Cases
        </Link>
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
      {/* Header with title and export button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '16px'
      }}>
        <h1 style={{
          fontSize: '28px',
          margin: 0,
          color: '#333'
        }}>
          Batch Results
        </h1>
        <button
          onClick={handleExport}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          Export JSON
        </button>
      </div>

      {/* Summary section placeholder */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <p style={{
          margin: 0,
          color: '#666',
          fontSize: '14px'
        }}>
          Summary section coming soon...
        </p>
      </div>

      {/* Results table placeholder */}
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        color: '#666'
      }}>
        Results table coming soon...
      </div>
    </div>
  )
}

export default ResultsPage
