import { Link } from 'react-router-dom'
import { getImageUrl } from '../api/images'
import './TestCaseCard.css'

function TestCaseCard({ testCase }) {
  const { id, name, image_hash, lineup } = testCase

  // Get image URL or use placeholder
  const imageUrl = image_hash ? getImageUrl(image_hash) : null

  // Count artists in lineup
  const artistCount = lineup ? lineup.length : 0

  return (
    <Link to={`/test-cases/${id}`} className="test-case-card">
      <div className="test-case-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={name} />
        ) : (
          <div className="test-case-card-placeholder">No Image</div>
        )}
      </div>
      <div className="test-case-card-content">
        <h3 className="test-case-card-title">{name}</h3>
        <div className="test-case-card-badge">
          {artistCount} {artistCount === 1 ? 'artist' : 'artists'}
        </div>
      </div>
    </Link>
  )
}

export default TestCaseCard
