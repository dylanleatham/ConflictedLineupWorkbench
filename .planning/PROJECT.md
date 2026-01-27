# Festival Lineup Prompt Evaluator

## What This Is

A prompt engineering workbench for testing different prompting strategies to extract festival lineups from images and text. This is a developer tool to iterate on system prompts and model selection before deploying to a production service.

## Core Value

Accurately measure which combination of system prompt + Claude model produces the most correct festival lineup extractions.

## Requirements

### Validated

- Test case CRUD (add/edit/delete with festival name, image, ground truth) — v1.0
- Custom system prompt input — v1.0
- Claude model selection — v1.0
- Text-based test execution (festival name → lineup) — v1.0
- Image-based test execution (festival image → lineup) — v1.0
- Batch test execution against all test cases — v1.0
- Aggregate results (percentage match + perfect score count) — v1.0
- Test case persistence between sessions — v1.0
- Local image storage with deduplication — v1.0
- Results export as JSON — v1.0

### Active

- [ ] Web search eval type (festival name + year → lineup via Claude web search)
- [ ] Separate tab UI for web search eval vs image eval
- [ ] Independent test cases per eval type
- [ ] Independent system prompt per eval type
- [ ] Batch execution scoped to current tab

### Out of Scope

- Fuzzy matching — strict string comparison only, "The Strokes" ≠ "Strokes"
- Production service — this is the testing tool, not the final app
- Cloud deployment — local development tool
- Multi-user support — single user tool
- Test run history — deferred to v2
- Cost/latency tracking — deferred to v2

## Current Milestone: v1.1 Web Search Eval

**Goal:** Add a second evaluation type that uses Claude's web search tools to find festival lineups from festival name + year.

**Target features:**
- New "Web Search Eval" tab alongside existing image eval
- Test cases with festival name + year as input
- Claude web search tool integration for lineup discovery
- Separate system prompt for web search strategy
- Tab-scoped batch execution

## Context

Shipped v1.0 with ~5,000 LOC (Python + React).

Tech stack: FastAPI backend, React + Vite frontend, JSON file storage, content-addressed image storage.

v1.1 adds a new eval dimension: testing prompt strategies for web-search-based lineup extraction, complementing the existing image-based extraction.

## Constraints

- **API**: Claude completion API (Anthropic) — requires ANTHROPIC_API_KEY env var
- **Backend**: Python + FastAPI
- **Frontend**: React + Vite
- **Storage**: Local JSON files + images in .festival-tests/
- **Matching**: Exact string comparison only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Strict string matching | User wants precise evaluation, no fuzzy logic | Good |
| Local-only tool | Development/testing use case, no need for deployment | Good |
| Test data in UI | User prefers managing test cases through interface rather than config files | Good |
| JSON file storage | Simple, human-readable, sufficient for handful of test cases | Good |
| Content-addressed images | SHA-256 hash for deduplication, automatic optimization | Good |
| localStorage for config | Prompt/model persist across page refreshes without backend | Good |

---
*Last updated: 2026-01-26 after starting v1.1 milestone*
