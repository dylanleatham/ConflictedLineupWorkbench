import { useState, useEffect } from 'react'

/**
 * Hook for managing image preview blob URLs.
 *
 * Creates a blob URL from a File object and handles cleanup when the file
 * changes or component unmounts to prevent memory leaks.
 *
 * @param {File|null} file - The image file to preview
 * @returns {string|null} - Blob URL for the image, or null if no file
 */
export function useImagePreview(file) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Cleanup: revoke blob URL when file changes or component unmounts
    return () => URL.revokeObjectURL(url)
  }, [file])

  return previewUrl
}
