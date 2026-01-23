# Festival Lineup Prompt Evaluator

## What This Is

A prompt engineering workbench for testing different prompting strategies to extract festival lineups from images and text. This is a developer tool to iterate on system prompts and model selection before deploying to a production service.

## Core Value

Accurately measure which combination of system prompt + Claude model produces the most correct festival lineup extractions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can add/edit/delete test cases (festival name, image, ground truth lineup)
- [ ] User can paste a custom system prompt
- [ ] User can select which Claude model to use
- [ ] User can run text-based tests (festival name → lineup)
- [ ] User can run image-based tests (festival image → lineup)
- [ ] User can run batch tests against all test cases
- [ ] User can see aggregate results (percentage match + perfect score count)
- [ ] Test cases persist between sessions
- [ ] Images stored locally and referenced by test cases

### Out of Scope

- Fuzzy matching — strict string comparison only, "The Strokes" ≠ "Strokes"
- Production service — this is the testing tool, not the final app
- Cloud deployment — local development tool
- Multi-user support — single user tool

## Context

The user is building a production service that extracts festival lineups from images/text using Claude. Before building that service, they need to determine the best prompting strategy. This tool lets them:

1. Define test cases with known ground truth (real festival lineups)
2. Try different system prompts and models
3. Measure accuracy objectively
4. Take the winning prompt to production

Test data is small (handful of festivals) with locally stored images.

## Constraints

- **API**: Claude completion API (Anthropic)
- **Backend**: Python + FastAPI
- **Frontend**: React (interactive UI)
- **Storage**: Local (images + test case persistence)
- **Matching**: Exact string comparison only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Strict string matching | User wants precise evaluation, no fuzzy logic | — Pending |
| Local-only tool | Development/testing use case, no need for deployment | — Pending |
| Test data in UI | User prefers managing test cases through interface rather than config files | — Pending |

---
*Last updated: 2026-01-22 after initialization*
