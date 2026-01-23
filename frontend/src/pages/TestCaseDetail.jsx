import { Link, useParams } from 'react-router-dom'

function TestCaseDetail() {
  const { id } = useParams()

  return (
    <div>
      <h1>Page: TestCaseDetail</h1>
      <p>Test case ID: {id}</p>
      <p>This is a placeholder for the test case detail page.</p>
      <div>
        <Link to="/">Back to Home</Link>
        {' | '}
        <Link to={`/test-cases/${id}/edit`}>Edit</Link>
      </div>
    </div>
  )
}

export default TestCaseDetail
