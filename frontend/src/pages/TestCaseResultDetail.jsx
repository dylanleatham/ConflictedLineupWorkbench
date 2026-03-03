import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getTestCase } from '../api/testCases'
import { getLastResult } from '../api/results'
import { getImageUrl } from '../api/images'
import ExecutionResult from '../components/ExecutionResult'

function TestCaseResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isWebSearch = location.pathname.startsWith('/web-search')
  const backPath = isWebSearch ? '/web-search' : '/'
  const [testCase, setTestCase] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const tc = await getTestCase(id)
        setTestCase(tc)

        try {
          const res = await getLastResult(id)
          setResult(res)
        } catch {
          // No result saved yet - that's fine
          setResult(null)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={() => navigate(backPath)} style={styles.backButton}>
          Back to Test Cases
        </button>
      </div>
    )
  }

  const imageUrl = testCase?.image_hash ? getImageUrl(testCase.image_hash) : null

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(backPath)} style={styles.backButton}>
        &larr; Back to Test Cases
      </button>

      <div style={styles.header}>
        {imageUrl && (
          <div style={styles.imageContainer}>
            <img src={imageUrl} alt={testCase.name} style={styles.image} />
          </div>
        )}
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>{testCase.name} {testCase.year || ''}</h1>
          <span style={styles.badge}>
            {testCase.lineup?.length || 0} ground truth artists
          </span>
        </div>
      </div>

      {result ? (
        <div style={styles.resultSection}>
          <ExecutionResult result={result} />
        </div>
      ) : (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>No results yet</h2>
          <p style={styles.emptyText}>
            Run this test case from the test case list to see results here.
          </p>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    fontSize: '16px',
  },
  error: {
    padding: '15px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
    marginBottom: '20px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    color: '#495057',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  imageContainer: {
    width: '200px',
    flexShrink: 0,
    borderRadius: '6px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '24px',
    color: '#333',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#e8eaff',
    color: '#535bf2',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  resultSection: {
    marginTop: '0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  emptyTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
  },
}

export default TestCaseResultDetail
