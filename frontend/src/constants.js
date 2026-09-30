export const DEFAULT_MODEL = 'claude-sonnet-4-6'

// Default system prompt and model for each workspace
export const WORKSPACE_DEFAULTS = {
  'image-eval': {
    prompt: 'Extract the festival lineup from this image. Return a JSON array of artist names.',
    model: DEFAULT_MODEL
  },
  'web-search-eval': {
    prompt: 'Search for the festival lineup and return the artist names as a JSON array.',
    model: DEFAULT_MODEL
  },
  'poster-search-eval': {
    prompt: 'Search for the lineup poster image for this festival and return a single direct URL to the image.',
    model: DEFAULT_MODEL
  }
}
