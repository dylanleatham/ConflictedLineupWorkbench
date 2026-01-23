import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTestCases } from '../api/testCases'
import TestCaseCard from '../components/TestCaseCard'

function TestCaseList() {
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTestCases() {
      try {
        setLoading(true)
        const data = await getTestCases()
        setTestCases(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTestCases()
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading test cases...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error loading test cases</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Test Cases</h1>
        <Link to="/test-cases/new" className="button-primary">
          Add Test Case
        </Link>
      </div>

      {testCases.length === 0 ? (
        <div className="empty-state">
          <p>No test cases yet.</p>
          <p>Create your first test case to get started.</p>
          <Link to="/test-cases/new" className="button-primary">
            Create Test Case
          </Link>
        </div>
      ) : (
        <div className="test-case-grid">
          {testCases.map((testCase) => (
            <TestCaseCard key={testCase.id} testCase={testCase} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TestCaseList
