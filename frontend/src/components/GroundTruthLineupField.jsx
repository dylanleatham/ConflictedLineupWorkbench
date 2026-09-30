/**
 * Self-contained component for entering ground truth lineup data.
 * Includes textarea, import from file, and paste from clipboard functionality.
 */
export function GroundTruthLineupField({ lineup, onChange, onError, disabled }) {
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
          onChange(text)
        } catch (err) {
          onError(`Failed to read file: ${err.message}`)
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
      onChange(text)
    } catch (err) {
      onError(`Failed to read clipboard: ${err.message}`)
    }
  }

  return (
    <>
      {/* Ground Truth Lineup */}
      <div style={styles.field}>
        <label htmlFor="lineup" style={styles.label}>
          Ground Truth Lineup * <span style={styles.hint}>(one artist per line)</span>
        </label>
        <textarea
          id="lineup"
          value={lineup}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
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
          disabled={disabled}
          style={styles.importButton}
        >
          Import from File
        </button>
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          disabled={disabled}
          style={styles.importButton}
        >
          Paste from Clipboard
        </button>
      </div>
    </>
  )
}

const styles = {
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
}
