import { Link, useParams } from 'react-router-dom'

function TestCaseEdit() {
  const { id } = useParams()

  return (
    <div>
      <h1>Page: TestCaseEdit</h1>
      <p>Editing test case ID: {id}</p>
      <p>This is a placeholder for the test case edit page.</p>
      <div>
        <Link to="/">Back to Home</Link>
        {' | '}
        <Link to={`/test-cases/${id}`}>View Details</Link>
      </div>
    </div>
  )
}

export default TestCaseEdit
