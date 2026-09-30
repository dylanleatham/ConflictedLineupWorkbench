# Measuring LLM Lineup Extraction: A Write-up

## The problem

I'm building an app that needs complete, accurate festival lineups: every artist, for many festivals, every year. Lineups are published as dense, stylized poster images. They also get picked up piecemeal by news sites, fan wikis, and ticketing pages. An LLM with vision and web search is the obvious tool, but "it looks right" doesn't hold up when a lineup has 250 artists and the app is only as good as its data.

So before building the product, I built the thing that tells me **which approach to trust**. That meant a harness with hand-verified ground truth, repeatable runs, and scores at the level of individual artists.

## What this project demonstrates

**LLM evaluation design**
- A ground-truth dataset: 15 festivals and 1,382 hand-verified artists, with the source posters.
- Three competing strategies measured on the same test cases: vision on the poster, web search from the name alone, and finding the poster online.
- Separate prompt and model configuration per strategy, so each variable can be tested in isolation.
- A metric for each task: artist set-matching for lineups and SSIM for poster retrieval.

**Handling real model output**
- A tolerant parser. Models return bare JSON arrays, `{"artists": [...]}` objects, code-fenced JSON, or JSON surrounded by prose. The parser tries these from strictest to loosest. When nothing parses, the raw response is kept so the failure can be diagnosed.
- Rate-limit handling. Exponential backoff runs inside a hard timeout, and batch runs are paced to stay under per-minute token limits.

**Full-stack engineering**
- A FastAPI backend with Pydantic v2 models.
- Background batch jobs with live progress polling and cooperative cancellation.
- Atomic JSON persistence: write to a temp file, then rename.
- Content-addressed image storage. Images are hashed with SHA-256 after optimization, so the same poster is only stored once.
- A React 19 frontend with three independent workspaces and prompt configuration that persists and stays in sync across browser tabs.
- **A shared evaluation engine.** Each workspace defines only two things: how to evaluate one test, and how to summarize a batch. One shared engine handles metadata, persistence, batching, cancellation, and the routes. One generic hook handles the batch lifecycle in the UI. The three workspaces first grew as near-copies of each other. Merging them removed about 1,000 lines and fixed three bugs along the way:
  - A route-shadowing bug that broke the "Run All" button.
  - Polling that stopped early when a test failed, or never stopped after a cancel.
  - A cancel that still ran one more test.

**Quality practices**
- A pytest suite: storage, scoring, parsing, image similarity, and API routes, including a regression test for a route-shadowing bug. The suite never calls the paid API.
- Linting with ruff and ESLint, and CI on GitHub Actions.
- Path-traversal-safe IDs.
- Secrets loaded only from the environment.

## Findings

### Web search is strong for most festivals and weak for the largest

Results for Claude Sonnet 4.6 using web search only (the input is `"<Festival> <Year>"`):

| Festival | Ground truth | Extracted | Recall | Precision |
|---|---:|---:|---:|---:|
| Beyond Wonderland 2026 | 57 | 57 | **100%** | 100% |
| FVDED in the Park 2026 | 58 | 58 | **100%** | 100% |
| Thunderdome 2025 | 20 | 21 | **100%** | 95% |
| Thunderdome 2026 | 22 | 25 | **100%** | 88% |
| Bass Canyon 2021 | 66 | 68 | 98% | 96% |
| Bass Canyon 2019 | 39 | 39 | 97% | 97% |
| Bass Canyon 2024 | 95 | 97 | 96% | 94% |
| Bass Canyon 2022 | 97 | 124 | 95% | **74%** |
| Beyond Wonderland 2025 | 59 | 58 | 93% | 95% |
| Bass Canyon 2025 | 97 | 97 | 91% | 91% |
| Coachella 2026 | 143 | 207 | 90% | **62%** |
| Bass Canyon 2023 | 95 | 89 | 89% | 96% |
| Lost Lands 2025 | 208 | 171 | 76% | 93% |
| Capitol Hill Block Party 2026 | 70 | 37 | **46%** | 86% |
| EDC Las Vegas 2026 | 256 | 100 | **30%** | 78% |
| **Mean** | | | **86.9%** | **89.7%** |

Four patterns stand out.

1. **Failures are bimodal and follow lineup size.** Festivals with fewer than about 100 artists mostly score above 90%. The three largest lineups score 30–76%. For EDC, Claude returned exactly 100 artists, which suggests the output hit a round-number ceiling rather than the end of the lineup. Weighting each artist equally, recall drops from 86.9% (averaged per festival) to **77.4%**. For my app, that per-artist number is the one that matters.
2. **Smaller local festivals have thin web coverage.** Capitol Hill Block Party has only 70 artists but scored 46%. Its lineup is mostly local acts, and it appears on the poster but in very few indexed pages.
3. **Over-generation is a separate failure mode.** For Coachella, recall was 90% but precision was 62%. Claude added about 75 artists who weren't on the official poster, probably from after-parties, side stages, or earlier years. **The app's headline metric is recall, so this didn't show up until I computed precision from the saved results.** That is the main change I'd make to the evaluator (see below).
4. **Sometimes the ground truth is wrong.** Reviewing misses showed that some "errors" were mine:
   - The EDC ground truth lists the same artist twice, once correctly as `Chloe Caillet` and once with a typo as `Choloe Caillet`. The typo counts as a guaranteed miss.
   - Claude's `Chloé Caillet` and `Tiësto` didn't match `Chloe Caillet` and `Tiesto` only because of the accents.
   - In Bass Canyon 2022, `Fury+MC Dino` was one poster credit that I had recorded as a single artist.

   An eval harness also audits its own dataset. Reviewing misses like these led to corrections in several ground-truth files.

### Vision is competitive, with few runs so far

Image Eval scored 97.4% on Bass Canyon 2019 (Sonnet 4) and 93.0% on Coachella 2026 (Sonnet 4.6). Coachella is a very dense poster with 143 names in small type. That result is comparable to web search (90.2%) and much more precise: 11 extra artists vs. 75. There are only two image runs so far, so this is a lead to follow up, not a conclusion.

### Asking the model to find the poster didn't work, and the harness showed why

Poster Search went 0 for 3. The captured responses show two different failure modes:

- Claude found a lineup *article* and summarized it, but returned `"poster_url": null`.
- Claude returned a URL that served an HTML page instead of an image (`content-type: text/html`).

The web search tool returns pages, not image assets. Getting the poster would need another step, such as fetching the page and reading its `og:image` or `<img>` tags, rather than a better prompt. Knowing this early kept me from spending time on prompt tweaks that couldn't work.

## Design decisions and trade-offs

- **Exact, normalized string matching instead of fuzzy matching.** Fuzzy matching would inflate scores and hide real errors, such as returning a different artist with a similar name. I chose to fix normalization issues (case, whitespace) explicitly and treat everything else as a finding. The accent cases above show where the next normalization step should go.
- **SSIM for poster similarity.** It's simple, deterministic, and has no extra dependencies. However, it's sensitive to crops and re-encodes, so it's a first pass. A perceptual hash or embedding similarity would be more robust.
- **Local JSON storage instead of a database.** This is a single-user developer tool. Plain files are easy to inspect, diff, and back up, and atomic writes remove the main risk.
- **In-memory batch state.** It's simple and good enough for a local tool. If the server restarts, the in-progress batch is lost, but each test's result has already been saved to disk.

## What I'd do next

1. **Report precision and F1 alongside recall** in the evaluator and UI, so over-generation is visible immediately.
2. **Normalize Unicode** (NFKD with diacritics removed) and support an **alias table** for artists who perform under several names.
3. **Keep run history** instead of only the last result per test, so prompt changes can be compared over time.
4. **Try a hybrid strategy**: extract from the poster first, then use web search to fill gaps. This is the direction the current image-eval prompt is already taking.

## How it was built

This project was built with AI pair-programming (Claude Code) inside a spec-driven workflow. Each milestone was planned, researched, and verified before and after implementation. I directed the product, the evaluation methodology, and the ground-truth dataset, and I reviewed and tested the implementation.
