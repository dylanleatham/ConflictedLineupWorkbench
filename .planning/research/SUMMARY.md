# Research Summary: Festival Lineup Extractor

**Project:** Festival Lineup Extractor - Prompt Engineering Workbench
**Date:** 2026-01-22
**Overall Confidence:** HIGH

---

## Executive Summary

A festival lineup extraction workbench is a focused prompt testing tool for multimodal (image + text) LLM evaluation. The recommended approach uses a **Python + FastAPI + React stack** optimized for single-user developer tools with minimal setup overhead. The core workflow is straightforward: upload festival images, define extraction prompts, run batch tests, and compare outputs against ground truth using entity-level validation (not string matching).

The key technical insight is that this is fundamentally a **batch async I/O problem**, not a compute-intensive ML problem. FastAPI's async capabilities handle concurrent Claude API calls efficiently, while React provides responsive UI for test management. SQLite offers zero-config persistence suitable for thousands of test cases without database server overhead.

Critical risks center on **evaluation methodology mistakes** rather than technology choices. Exact string matching fails catastrophically for LLM outputs due to nondeterminism. Teams must design for normalized entity comparison, multi-run aggregation, and vision-specific failure modes from day one. The architecture must separate test execution from evaluation to enable re-scoring without expensive API re-calls.

---

## Key Findings

### Stack (Technology Choices)

**Backend:**
- **Python 3.13 + FastAPI 0.126+** - Async-first framework ideal for I/O-bound LLM workloads (3000+ req/s throughput)
- **Anthropic SDK 0.43+** - Official Claude client with vision/multimodal support, handles retries and streaming
- **SQLite 3.45+** - Zero-config, single-file database perfect for single-user tools
- **Pydantic v2.12+** - Required by FastAPI 0.126+, provides 5-20x performance boost via Rust core

**Frontend:**
- **React 19 + TypeScript 5.9 + Vite 6** - Modern standard with instant HMR and auto-optimization
- **TanStack Query v5** - Server state management with automatic caching and background refetch
- **Zustand 5.0+** - Lightweight client state (1KB, 95% less boilerplate than Redux)
- **Tailwind CSS 4.1+** - Utility-first styling with 5x faster builds via Rust Oxide engine

**Critical version notes:**
- FastAPI 0.126+ dropped Pydantic v1 support - migration required
- React 19 includes compiler for auto-memoization - remove manual useMemo/useCallback
- Tailwind v4 uses `@import "tailwindcss"` syntax (not `@tailwind` directives)

### Features (What to Build)

**Table Stakes (MVP):**
1. Test case CRUD - Add festival name, image, expected lineup
2. Prompt editor - Template syntax with variables
3. Batch execution - "Run all tests" with async processing
4. Results display - Side-by-side expected vs actual
5. Basic metrics - Accuracy percentage with pass/fail

**High-Value Differentiators:**
- Visual image preview - See poster thumbnails in test list
- Partial credit scoring - Fuzzy matching instead of binary pass/fail
- Export results - CSV download for analysis
- Per-artist matching - Granular feedback on which entities matched

**Explicitly Defer (Anti-Features):**
- Production monitoring - Overkill for testing workbench
- Real-time streaming - Batch testing doesn't need live updates
- LLM-as-judge metrics - Adds nondeterminism; stick to entity comparison
- Multi-user collaboration - Avoid auth/permissions overhead
- RAG evaluation - Not relevant for direct extraction tasks

### Architecture (Build Order & Patterns)

**Layered Architecture:**
```
React Frontend (Test Management + Results Dashboard)
    ↓ REST API + WebSocket
FastAPI Backend
    ↓ Orchestration Layer (Job Queue + Batch Processor)
    ↓ Service Layer (LLM Client + Evaluator + Storage)
    ↓ Infrastructure (File Storage + Cache)
```

**Critical patterns:**
1. **Async/await throughout** - LLM calls are I/O-bound (2-10s latency); async enables 100+ concurrent requests per worker
2. **Job queue with backpressure** - Rate limiting prevents Claude API 429 errors; use asyncio.Queue or Redis Queue
3. **WebSocket for progress** - Server-push updates eliminate polling overhead
4. **Content-addressed image storage** - SHA256 hashing provides automatic deduplication
5. **Separation of execution from evaluation** - Store raw LLM responses separately to enable re-scoring without API re-calls

**Build sequence:**
1. Phase 1: Storage + Image Service + FastAPI scaffold (foundation)
2. Phase 2: LLM Client + Single test executor + Evaluator (validate integration)
3. Phase 3: Job Queue + Batch processor + WebSocket (scale to multiple tests)
4. Phase 4: React UI for test management and results (user-facing)
5. Phase 5: Analysis tools + Strategy comparison (optimization features)

### Pitfalls (What to Avoid)

**Critical (cause rewrites):**
1. **Exact string matching for ground truth** - LLM outputs are nondeterministic; use normalized entity comparison
2. **Not accounting for nondeterminism** - Run each test 3-5 times, use "pass if ≥80% succeed" thresholds
3. **Imperfect ground truth treated as perfect** - Require multi-annotator validation, measure inter-annotator agreement
4. **Testing prompts in isolation** - Evaluate full pipeline (image → extraction → LLM → parsed output)

**High Priority (cause delays):**
5. **No prompt version control** - Semantic versioning with Git, regression test suite on version changes
6. **Batch testing without rate limiting** - Implement exponential backoff, use Anthropic Batch API (50% cost savings)
7. **Ignoring vision-specific failures** - Test image preprocessing separately, document model perception limitations

**Medium Priority (reduce efficiency):**
8. **Using BLEU/ROUGE metrics** - These miss semantic equivalence; use entity-level F1 or structured comparison
9. **Inadequate test coverage** - Need 50-100 cases minimum with 60% happy path, 30% edge cases, 10% adversarial
10. **Coupling evaluation to prompt format** - Design for multiple output formats to enable strategy experimentation

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Foundation (Core Testing Infrastructure) - 1 week**
- Storage service (JSON file-based)
- Image upload with content-addressing
- FastAPI scaffold with CORS
- Pydantic models for test cases
**Rationale:** Storage and image handling are dependencies for everything else. Get file I/O correct early.
**Pitfalls to avoid:** Design for normalized entity comparison from day 1, not string matching. Build in multi-run aggregation.

**Phase 2: Ground Truth Dataset - 3-5 days**
- Create 50-100 test cases with multi-annotator validation
- Document coverage: 60% happy path, 30% edge cases, 10% adversarial
- Measure inter-annotator agreement (Cohen's kappa)
- Define entity normalization rules
**Rationale:** Bad ground truth makes everything else meaningless. Invest in quality upfront.
**Pitfalls to avoid:** Trusting unchecked annotations. Require 2-3 annotators per case, flag low-agreement items.

**Phase 3: Single Test Execution - 3-4 days**
- LLM client with vision support (Anthropic SDK)
- Single test executor with template variables
- Evaluator service (entity-level comparison)
- Retry logic with exponential backoff
**Rationale:** Validate LLM integration works before adding batching complexity.
**Pitfalls to avoid:** Don't use traditional NLP metrics (BLEU/ROUGE). Design evaluator to accept multiple output formats.

**Phase 4: Batch Execution - 1 week**
- Job queue (asyncio.Queue with semaphore)
- Batch processor with rate limiting
- WebSocket manager for progress updates
- Result storage and aggregation
**Rationale:** Scale to multiple tests with proper concurrency control.
**Pitfalls to avoid:** Implement rate limiting before hitting API limits. Request rate limit increases from Anthropic.

**Phase 5: React UI - 1 week**
- Test case manager (CRUD + image preview)
- Execution controller with real-time progress
- Results dashboard (filtering, export)
- Side-by-side comparison view
**Rationale:** Frontend can be developed quickly once backend API is stable.
**Pitfalls to avoid:** Build rich debugging views (show actual vs expected, highlight differences).

**Phase 6: Optimization & Analysis - 3-5 days**
- Result aggregator with summary statistics
- Strategy comparator (A/B testing UI)
- CSV/JSON export
- Cost and speed tracking
**Rationale:** Enable data-driven prompt iteration and decision-making.
**Pitfalls to avoid:** Separate test tiers (smoke tests vs full suite) to maintain fast feedback loops.

### Research Flags

**Phases likely needing `/gsd:research-phase`:**
- Phase 2 (Ground Truth Dataset) - Domain-specific entity extraction patterns
- Phase 4 (Batch Execution) - Anthropic rate limits and Batch API integration
- Phase 6 (Optimization) - Statistical significance testing for A/B comparisons

**Phases with well-documented patterns (skip research):**
- Phase 1 (Foundation) - Standard FastAPI patterns
- Phase 3 (Single Test) - Anthropic SDK official docs
- Phase 5 (React UI) - Standard React + TanStack Query patterns

### Dependencies Between Phases

```
Phase 1 (Foundation) ──→ Phase 3 (Single Test) ──→ Phase 4 (Batch Execution) ──→ Phase 5 (React UI) ──→ Phase 6 (Analysis)
                    ↓
                Phase 2 (Ground Truth Dataset) ──→ Phase 3
```

- Phases 1 and 2 can run in parallel
- Phase 3 blocks on Phase 1 (needs storage) and Phase 2 (needs test cases)
- Phase 4 blocks on Phase 3 (must validate single-test execution)
- Phase 5 blocks on Phase 4 (needs stable API)
- Phase 6 blocks on Phase 5 (needs real usage data)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Stack | **HIGH** | FastAPI, React 19, Anthropic SDK verified via official docs. All versions current for 2026. |
| Features | **HIGH** | Table stakes validated across Promptfoo, Braintrust, DeepEval. Anti-features based on scope analysis. |
| Architecture | **HIGH** | Patterns verified with FastAPI full-stack template, LLM evaluation frameworks, 2026 best practices. |
| Pitfalls | **HIGH** | Critical pitfalls documented in recent research (Jan 2026 flakiness study, 2026 evaluation guides). |

**Overall:** This research is production-grade with verified sources. All core recommendations cross-referenced with official documentation or authoritative 2026 sources.

---

## Gaps to Address

1. **Anthropic rate limits for testing workloads** - Need to request specific limits for batch testing
2. **Entity normalization rules for artist names** - Domain-specific research needed for music industry name variations
3. **Vision model limitations for poster text extraction** - Test Claude Sonnet 4.5 vision capabilities with real festival images
4. **Statistical significance thresholds for A/B testing** - Need sample size calculations for valid strategy comparisons

These gaps should be addressed during phase execution, not as blockers to starting.

---

## Sources

### Stack Research
- FastAPI Best Practices 2025: https://github.com/zhanymkanov/fastapi-best-practices
- Anthropic Python SDK: https://github.com/anthropics/anthropic-sdk-python
- React + Vite Guide 2026: https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2
- TanStack Query Docs: https://tanstack.com/query/latest
- Tailwind CSS v4.0 Release: https://tailwindcss.com/blog/tailwindcss-v4

### Features Research
- Best Prompt Evaluation Tools 2025: https://www.braintrust.dev/articles/best-prompt-evaluation-tools-2025
- Promptfoo Documentation: https://www.promptfoo.dev/docs/intro/
- 8 LLM Evaluation Tools in 2026: https://techhq.com/news/8-llm-evaluation-tools-you-should-know-in-2026/
- Top 5 Prompt Engineering Platforms 2026: https://www.getmaxim.ai/articles/top-5-prompt-engineering-platforms-in-2026/

### Architecture Research
- FastAPI Full-Stack Template: https://github.com/fastapi/full-stack-fastapi-template
- LLM System Design Guide: https://medium.com/@vi.ha.engr/the-architects-guide-to-llm-system-design-from-prompt-to-production-8be21ebac8bc
- Batch Processing for LLMs: https://medium.com/next-token/scaling-llm-workloads-with-openais-batch-api-a-guide-for-data-and-ai-engineers-7c706713c02d
- Request Queueing for LLM Performance: https://huggingface.co/blog/tngtech/llm-performance-request-queueing

### Pitfalls Research
- Avoiding LLM Evaluation Pitfalls: https://www.honeyhive.ai/post/avoiding-common-pitfalls-in-llm-evaluation
- LLM Evaluation Metrics Guide: https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation
- On Flakiness of LLM-Generated Tests (Jan 2026): https://arxiv.org/html/2601.08998
- Demystifying Evals for AI Agents: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- LLM-as-a-judge Guide: https://www.evidentlyai.com/llm-guide/llm-as-a-judge
- Ground Truth Annotation Quality: https://www.statsig.com/perspectives/ground-truth-annotation-data-quality

---

## Ready for Requirements

This research provides a solid foundation for roadmap creation. The roadmapper should:
1. Use the suggested 6-phase structure as a starting point
2. Prioritize Phase 1 (Foundation) and Phase 2 (Ground Truth) as critical path
3. Flag Phase 2, 4, and 6 for targeted research during planning
4. Build in evaluation methodology validation early (Phases 1-2) to avoid costly rework
5. Plan for iterative refinement based on real test data after Phase 5

The biggest risk is not technology choices but **evaluation methodology mistakes** (string matching, nondeterminism, imperfect ground truth). Address these in architectural decisions from day one.
