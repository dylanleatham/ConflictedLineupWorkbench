import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTestCase } from '../../api/testCases'
import { GroundTruthLineupField, parseLineup } from '../../components/GroundTruthLineupField'

function TestCaseCreate() {
  const navigate = useNavigate()
  // Form state
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [lineup, setLineup] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Validate form before submission.
   */
  const validateForm = () => {
    if (!name.trim()) {
      setError('Festival name is required')
      return false
    }

    if (!year.trim()) {
      setError('Year is required')
      return false
    }

    if (!/^\d{4}$/.test(year.trim())) {
      setError('Year must be a 4-digit number')
      return false
    }

    const artists = parseLineup(lineup)
    if (artists.length === 0) {
      setError('At least one artist is required')
      return false
    }

    return true
  }

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Parse lineup
      const artists = parseLineup(lineup)

      // Create test case via API
      await createTestCase(name.trim(), artists, null, year.trim())

      // Navigate to list
      navigate('/web-search')
    } catch (err) {
      setError(err.message || 'Failed to create test case')
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1>Create Test Case</h1>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Festival Name */}
        <div style={styles.field}>
          <label htmlFor="name" style={styles.label}>
            Festival Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            style={styles.input}
            placeholder="e.g. Coachella"
          />
        </div>

        {/* Year */}
        <div style={styles.field}>
          <label htmlFor="year" style={styles.label}>
            Year *
          </label>
          <input
            id="year"
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={isSubmitting}
            style={styles.input}
            placeholder="e.g. 2024"
            maxLength={4}
          />
        </div>

        {/* Ground Truth Lineup */}
        <GroundTruthLineupField
          lineup={lineup}
          onChange={setLineup}
          onError={setError}
          disabled={isSubmitting}
        />

        {/* Submit */}
        <div style={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isSubmitting ? 'Creating...' : 'Create Test Case'}
          </button>
          <Link to="/web-search" style={styles.cancelLink}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  cancelLink: {
    color: '#666',
    textDecoration: 'none',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c00',
    marginBottom: '20px',
  },
}

export default TestCaseCreate
