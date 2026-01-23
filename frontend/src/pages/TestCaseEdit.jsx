import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getTestCase, updateTestCase } from '../api/testCases'
import { uploadImage, getImageUrl } from '../api/images'
import { ImagePreview } from '../components/ImagePreview'

function TestCaseEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [lineup, setLineup] = useState('')
  const [existingImageHash, setExistingImageHash] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load test case data on mount and pre-fill form.
   */
  useEffect(() => {
    const loadTestCase = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getTestCase(id)

        // Pre-fill form fields
        setName(data.name)
        setExistingImageHash(data.image_hash)
        setLineup(data.lineup.join('\n'))
      } catch (err) {
        setError(err.message || 'Failed to load test case')
      } finally {
        setIsLoading(false)
      }
    }

    loadTestCase()
  }, [id])

  /**
   * Handle image file selection.
   */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setRemoveImage(false) // If selecting new file, don't remove
    }
  }

  /**
   * Handle removing the existing image.
   */
  const handleRemoveImage = () => {
    setRemoveImage(true)
    setImageFile(null)
  }

  /**
   * Handle keeping the existing image.
   */
  const handleKeepImage = () => {
    setRemoveImage(false)
    setImageFile(null)
  }

  /**
   * Import ground truth from a text file.
   */
  const handleImportFromFile = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'

    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (file) {
        try {
          const text = await file.text()
          setLineup(text)
        } catch (err) {
          setError(`Failed to read file: ${err.message}`)
        }
      }
    }

    input.click()
  }

  /**
   * Paste ground truth from clipboard.
   */
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setLineup(text)
    } catch (err) {
      setError(`Failed to read clipboard: ${err.message}`)
    }
  }

  /**
   * Parse lineup textarea into array of artist names.
   * Splits by newlines, trims whitespace, filters empty lines.
   */
  const parseLineup = (text) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  /**
   * Validate form before submission.
   */
  const validateForm = () => {
    if (!name.trim()) {
      setError('Festival name is required')
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
      // Determine image hash to use
      let imageHash = existingImageHash

      if (removeImage) {
        // User wants to remove image
        imageHash = null
      } else if (imageFile) {
        // User selected a new image - upload it
        const result = await uploadImage(imageFile)
        imageHash = result.hash
      }
      // Otherwise keep existing image hash

      // Parse lineup
      const artists = parseLineup(lineup)

      // Update test case
      const updates = {
        name: name.trim(),
        lineup: artists,
        image_hash: imageHash,
      }

      await updateTestCase(id, updates)

      // Navigate back to detail page
      navigate(`/test-cases/${id}`)
    } catch (err) {
      setError(err.message || 'Failed to update test case')
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <p>Loading test case...</p>
      </div>
    )
  }

  // Error state (if failed to load)
  if (error && !name) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <Link to={`/test-cases/${id}`} style={styles.cancelLink}>
          Back to Detail
        </Link>
      </div>
    )
  }

  // Determine which image to show in preview
  const existingUrl = existingImageHash && !removeImage && !imageFile
    ? getImageUrl(existingImageHash)
    : null

  return (
    <div style={styles.container}>
      <h1>Edit Test Case</h1>

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
            placeholder="e.g. Coachella 2024"
          />
        </div>

        {/* Image Upload */}
        <div style={styles.field}>
          <label htmlFor="image" style={styles.label}>
            Festival Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSubmitting}
            style={styles.fileInput}
          />
          {existingImageHash && !imageFile && (
            <div style={styles.imageActions}>
              {removeImage ? (
                <button
                  type="button"
                  onClick={handleKeepImage}
                  disabled={isSubmitting}
                  style={styles.imageActionButton}
                >
                  Keep Current Image
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                  style={styles.imageActionButton}
                >
                  Remove Image
                </button>
              )}
            </div>
          )}
        </div>

        {/* Image Preview */}
        <div style={styles.field}>
          <ImagePreview file={imageFile} existingUrl={existingUrl} />
        </div>

        {/* Ground Truth Lineup */}
        <div style={styles.field}>
          <label htmlFor="lineup" style={styles.label}>
            Ground Truth Lineup * <span style={styles.hint}>(one artist per line)</span>
          </label>
          <textarea
            id="lineup"
            value={lineup}
            onChange={(e) => setLineup(e.target.value)}
            disabled={isSubmitting}
            style={styles.textarea}
            placeholder="Artist 1&#10;Artist 2&#10;Artist 3"
            rows={10}
          />
        </div>

        {/* Import Buttons */}
        <div style={styles.importButtons}>
          <button
            type="button"
            onClick={handleImportFromFile}
            disabled={isSubmitting}
            style={styles.importButton}
          >
            Import from File
          </button>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            disabled={isSubmitting}
            style={styles.importButton}
          >
            Paste from Clipboard
          </button>
        </div>

        {/* Submit */}
        <div style={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            to={`/test-cases/${id}`}
            style={styles.cancelLink}
            onClick={(e) => {
              if (isSubmitting) e.preventDefault()
            }}
          >
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
  hint: {
    fontWeight: 'normal',
    color: '#666',
    fontSize: '13px',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  fileInput: {
    fontSize: '14px',
  },
  imageActions: {
    marginTop: '8px',
  },
  imageActionButton: {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  textarea: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'monospace',
    resize: 'vertical',
  },
  importButtons: {
    display: 'flex',
    gap: '10px',
  },
  importButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
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

export default TestCaseEdit
