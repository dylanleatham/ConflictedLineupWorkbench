import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../api/images'
import './TestCaseCard.css'

/**
 * Unified test case card component for both Image Eval and Web Search Eval.
 *
 * @param {object} props
 * @param {object} props.testCase - Test case data { id, name, lineup, image_hash?, year? }
 * @param {function} props.onRun - Called when Run button is clicked
 * @param {function} props.onDelete - Called when Delete button is clicked
 * @param {string} props.detailPath - Path to navigate when card body is clicked (optional)
 * @param {string} props.editPath - Path for Edit button
 * @param {boolean} props.isRunning - True if this test is currently running
 * @param {boolean} props.isDisabled - True if actions should be disabled (e.g., another test running)
 * @param {object} props.lastResult - Last test result { status, accuracy: { matched, total_ground_truth, accuracy_percentage, extra }, error }
 */
function TestCaseCard({
  testCase,
  onRun,
  onDelete,
  detailPath,
  editPath,
  isRunning = false,
  isDisabled = false,
  lastResult = null
}) {
  const navigate = useNavigate()
  const { name, lineup, image_hash, year } = testCase

  // Get image URL if available
  const imageUrl = image_hash ? getImageUrl(image_hash) : null

  // Count artists in lineup
  const artistCount = lineup ? lineup.length : 0

  const handleCardClick = (e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest('.test-case-card-actions')) {
      return
    }
    if (detailPath) {
      navigate(detailPath)
    }
  }

  const handleRun = (e) => {
    e.stopPropagation()
    if (onRun && !isDisabled && !isRunning) {
      onRun()
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    if (editPath) {
      navigate(editPath)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete && !isRunning) {
      onDelete()
    }
  }

  return (
    <div
      className={`test-case-card ${detailPath ? 'test-case-card-clickable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="test-case-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={name} />
        ) : (
          <div className="test-case-card-placeholder">No Image</div>
        )}
      </div>
      <div className="test-case-card-content">
        <h3 className="test-case-card-title">{name} {year}</h3>
        <div className="test-case-card-badge">
          {artistCount} {artistCount === 1 ? 'artist' : 'artists'}
        </div>
      </div>
      <div className="test-case-card-actions">
        <button
          className={`test-case-card-btn test-case-card-run-btn ${isRunning ? 'running' : ''}`}
          onClick={handleRun}
          disabled={isDisabled || isRunning}
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
        <button
          className="test-case-card-btn test-case-card-edit-btn"
          onClick={handleEdit}
          disabled={isRunning}
        >
          Edit
        </button>
        <button
          className="test-case-card-btn test-case-card-delete-btn"
          onClick={handleDelete}
          disabled={isRunning}
        >
          Delete
        </button>
      </div>
      {lastResult && (
        <div className="test-case-card-last-result">
          <span className="last-result-label">Last Result:</span>
          {lastResult.status === 'failed' ? (
            <span className="last-result-error">Error</span>
          ) : (
            <div className="last-result-stats">
              <span className="last-result-passed">{lastResult.accuracy.matched} pass</span>
              <span className="last-result-failed">{lastResult.accuracy.total_ground_truth - lastResult.accuracy.matched} fail</span>
              <span className="last-result-percentage">{lastResult.accuracy.accuracy_percentage.toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TestCaseCard
