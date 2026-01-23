import { useImagePreview } from '../hooks/useImagePreview'

/**
 * Image preview component with proper blob URL management.
 *
 * Displays an image preview from either:
 * - A File object (for new uploads, uses blob URL)
 * - An existing URL string (for displaying saved images)
 * - Shows placeholder when neither provided
 *
 * @param {Object} props
 * @param {File|null} props.file - File object to preview
 * @param {string|null} props.existingUrl - URL of existing image
 */
export function ImagePreview({ file, existingUrl }) {
  const previewUrl = useImagePreview(file)

  // Determine which URL to use
  const imageUrl = previewUrl || existingUrl

  return (
    <div style={styles.container}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Preview"
          style={styles.image}
        />
      ) : (
        <div style={styles.placeholder}>
          <p style={styles.placeholderText}>No image selected</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '600px',
    height: '400px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  placeholder: {
    textAlign: 'center',
    color: '#999',
  },
  placeholderText: {
    margin: 0,
    fontSize: '16px',
  },
}

export default ImagePreview
