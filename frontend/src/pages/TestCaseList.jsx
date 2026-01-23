import { Link } from 'react-router-dom'

function TestCaseList() {
  return (
    <div>
      <h1>Page: TestCaseList</h1>
      <p>This is a placeholder for the test case list page.</p>
      <Link to="/test-cases/new">Create New Test Case</Link>
    </div>
  )
}

export default TestCaseList
