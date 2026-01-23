# Phase 1: Foundation & Data - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Storage infrastructure for test data persistence and local image handling. Test cases persist between sessions. Images uploaded by user are stored locally and retrievable. Application can reference images from test cases without re-upload.

</domain>

<decisions>
## Implementation Decisions

### Storage location
- Project folder storage: `.festival-tests` folder in project directory
- Git-friendly: Data should be committed to version control (shareable across machines)
- Optimize images on upload: Resize/compress to reduce storage, accept potential detail loss
- Deduplicate identical images: Store once, reference from multiple test cases

### Data structure
- Flat list organization: All test cases in one list, no folders or tags
- One JSON file per test case: Human-readable, easy to edit manually
- Simple lineup format: Array of artist names `["Artist A", "Artist B", "Artist C"]`
- Minimal metadata: Just name, image path, lineup — no extra fields

### Claude's Discretion
- Image compression algorithm and target size
- JSON file naming convention
- Deduplication detection method (hash-based recommended)
- Error handling for corrupted files

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-data*
*Context gathered: 2026-01-22*
