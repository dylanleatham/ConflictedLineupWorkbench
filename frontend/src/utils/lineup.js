/**
 * Parse lineup textarea into array of artist names.
 * Splits by newlines, trims whitespace, filters empty lines.
 */
export function parseLineup(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
