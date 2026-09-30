import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getTestCase } from '../api/testCases'
import { getLastResult } from '../api/results'
import { getImageUrl } from '../api/images'
import { useStickyState } from '../hooks/useStickyState'
import { useExecution, useWebSearchExecution, usePosterSearchExecution } from '../hooks/useExecution'
import ExecutionResult from '../components/ExecutionResult'
import PosterSearchResult from './poster-search/PosterSearchResult'

function getWorkspaceFromPath(pathname) {
  if (pathname.startsWith('/poster-search')) return 'poster-search'
  if (pathname.startsWith('/web-search')) return 'web-search'
  return 'image-eval'
}

const CONFIG_DEFAULTS = {
  'image-eval': {
    system_prompt: 'Extract the festival lineup from this image. Return a JSON array of artist names.',
    claude_model: 'claude-sonnet-4-6'
  },
  'web-search': {
    system_prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
    claude_model: 'claude-sonnet-4-6'
  },
  'poster-search': {
    system_prompt: 'Search for the lineup poster image for this festival and return a single direct URL to the image.',
    claude_model: 'claude-sonnet-4-6'
  }
}

const STORAGE_KEYS = {
  'image-eval': 'festival-evaluator:prompt-config',
  'web-search': 'web-search-eval:prompt-config',
  'poster-search': 'poster-search-eval:prompt-config'
}

function TestCaseResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const workspace = getWorkspaceFromPath(location.pathname)
  const backPath = workspace === 'web-search' ? '/web-search'
    : workspace === 'poster-search' ? '/poster-search'
    : '/'
  const [testCase, setTestCase] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Read prompt config for the current workspace
  const [config] = useStickyState(CONFIG_DEFAULTS[workspace], STORAGE_KEYS[workspace])

  // Execution hooks
  const imageExec = useExecution()
  const webSearchExec = useWebSearchExecution()
  const posterSearchExec = usePosterSearchExecution()

  const execHook = workspace === 'poster-search' ? posterSearchExec
    : workspace === 'web-search' ? webSearchExec
    : imageExec

  const [runError, setRunError] = useState(null)

  async function handleRun() {
    if (!testCase) return
    setRunError(null)
    try {
      let res
      if (workspace === 'image-eval') {
        res = await imageExec.execute(id, {
          system_prompt: config.system_prompt,
          model: config.claude_model
        })
      } else if (workspace === 'web-search') {
        res = await webSearchExec.execute(id, testCase, config)
      } else {
        res = await posterSearchExec.execute(id, testCase, config)
      }
      setResult(res)
    } catch (err) {
      setRunError(err.message)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const tc = await getTestCase(id)
        setTestCase(tc)

        try {
          const res = await getLastResult(id, workspace)
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
  }, [id, workspace])

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
          <div style={styles.headerActions}>
            <span style={styles.badge}>
              {testCase.lineup?.length || 0} ground truth artists
            </span>
            <button
              onClick={handleRun}
              disabled={execHook.isExecuting}
              style={{
                ...styles.runButton,
                ...(execHook.isExecuting ? styles.runButtonDisabled : {})
              }}
            >
              {execHook.isExecuting ? 'Running...' : 'Run Test'}
            </button>
          </div>
          {runError && (
            <div style={styles.runError}>{runError}</div>
          )}
        </div>
      </div>

      {result ? (
        <div style={styles.resultSection}>
          {workspace === 'poster-search'
            ? <PosterSearchResult result={result} />
            : <ExecutionResult result={result} />
          }
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
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
  runButton: {
    padding: '6px 16px',
    backgroundColor: '#535bf2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  runButtonDisabled: {
    backgroundColor: '#999',
    cursor: 'not-allowed',
  },
  runError: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
    fontSize: '13px',
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
