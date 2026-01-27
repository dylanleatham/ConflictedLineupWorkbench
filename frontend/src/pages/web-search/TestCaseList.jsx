import { Link } from 'react-router-dom'
import { useWebSearchTests } from '../../hooks/useWebSearchTests'

function TestCaseList() {
  const { tests, deleteTest } = useWebSearchTests()

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteTest(id)
    }
  }

  // Sort tests by year descending (most recent first)
  const sortedTests = [...tests].sort((a, b) => parseInt(b.year) - parseInt(a.year))

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Test Cases</h1>
        <Link to="/web-search/test-cases/new" style={styles.addButton}>
          Add Test Case
        </Link>
      </div>

      {sortedTests.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No test cases yet.</p>
          <p>Create your first test case to get started.</p>
          <Link to="/web-search/test-cases/new" style={styles.createButton}>
            Create Test Case
          </Link>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Festival Name</th>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Artists</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTests.map((test) => (
              <tr key={test.id} style={styles.tr}>
                <td style={styles.td}>{test.name}</td>
                <td style={styles.td}>{test.year}</td>
                <td style={styles.td}>{test.lineup.length}</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <Link to={`/web-search/test-cases/${test.id}/edit`} style={styles.editLink}>
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(test.id, test.name)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  createButton: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '4px',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
    color: '#333',
  },
  tr: {
    borderBottom: '1px solid #e0e0e0',
  },
  td: {
    padding: '12px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  editLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
  deleteButton: {
    padding: '4px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}

export default TestCaseList
