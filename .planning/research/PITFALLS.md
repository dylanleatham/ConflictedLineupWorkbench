# Domain Pitfalls: Prompt Evaluation/Testing Tools

**Domain:** Prompt engineering workbench for LLM output evaluation
**Researched:** 2026-01-22
**Confidence:** HIGH (verified with multiple 2026 sources)

## Critical Pitfalls

Mistakes that cause rewrites, major issues, or fundamentally broken evaluation systems.

### Pitfall 1: Relying Solely on Exact String Matching for Ground Truth Comparison

**What goes wrong:** Using strict string comparison (e.g., `expected == actual`) to validate LLM outputs fails catastrophically because LLMs generate semantically equivalent but syntactically different responses. You'll get false negatives where correct answers are marked as failures.

**Why it happens:** String matching feels simple and deterministic, but LLM outputs are inherently variable - same semantic meaning, different surface forms (whitespace, punctuation, phrasing, synonyms).

**Consequences:**
- False negatives dominate: Valid outputs marked as failures
- Test suite becomes unusable noise
- Cannot distinguish real regressions from formatting variations
- Team loses trust in the evaluation system

**Prevention:**
- Accept that strict string matching is fundamentally incompatible with LLM evaluation
- For structured extraction tasks, compare parsed/normalized data structures, not raw strings
- Validate extracted entities (artist names, dates) after normalization, not surface text
- Document explicitly what level of variation is acceptable vs. a real failure

**Detection:**
- High test failure rate (>30%) on manually verified correct outputs
- Engineers override or ignore failing tests regularly
- Test failures don't correlate with actual quality issues
- Same prompt produces "failing" results that humans judge as correct

**Phase mapping:** Phase 1 (Core Testing Infrastructure) - Must establish proper comparison strategy from the start

---

### Pitfall 2: Not Accounting for LLM Nondeterminism in Test Design

**What goes wrong:** Tests assume deterministic outputs (like unit tests), but LLMs produce different valid outputs on repeated runs with identical inputs. Tests become "flaky" - passing then failing unpredictably.

**Why it happens:** Teams treat LLM testing like traditional software testing where determinism is expected. Even with temperature=0, models can produce variations.

**Consequences:**
- Flaky tests erode confidence in the entire test suite
- Cannot detect real regressions vs. random variation
- Wasted time re-running tests to "see if it passes this time"
- No reliable signal for prompt quality improvements
- Recent research (Jan 2026) shows LLM-generated tests have higher flakiness rates

**Prevention:**
- Run each test case N times (3-5 runs minimum) and aggregate results
- Use statistical thresholds: "Pass if ≥80% of runs succeed" instead of "Pass if single run succeeds"
- Separate evaluation metrics from pass/fail criteria
- Track variance across runs as a metric itself
- Use deterministic graders where possible, LLM graders only when necessary
- For critical assertions, demand consistent results across all runs

**Detection:**
- Tests pass/fail inconsistently without code changes
- Same prompt + same test case produces different results across runs
- Team develops habit of "just run it again"
- CI/CD pipelines fail randomly

**Phase mapping:** Phase 1 (Core Testing Infrastructure) - Build in run aggregation from day one

---

### Pitfall 3: Imperfect Ground Truth Treated as Perfect

**What goes wrong:** The "golden dataset" contains errors, inconsistencies, or biases, but the system treats it as absolute truth. Bad ground truth produces misleading evaluation results that can make worse prompts appear better.

**Why it happens:** Creating perfect ground truth is extremely expensive and time-consuming. Teams rush to build datasets without rigorous validation. Annotation errors, annotator disagreement, and incomplete coverage go undetected.

**Consequences:**
- Evaluation optimizes for wrong targets (garbage in = garbage out)
- Bias in ground truth gets amplified in production
- Edge cases and rare scenarios missing from dataset
- Substantial bias in accuracy estimates per research findings
- Models learn annotator quirks rather than real-world patterns

**Prevention:**
- Multi-annotator agreement: Require 2-3 humans to label each test case
- Measure inter-annotator agreement (Cohen's kappa) - flag low-agreement items for review
- Separate validation set that's extra carefully curated for final evaluation
- Document known gaps and biases in ground truth
- Version ground truth datasets with changelog
- Regular ground truth audits: Sample and re-validate periodically
- Test on real production data, not just curated datasets

**Detection:**
- Annotator disagreement rates >20% on test cases
- Production performance diverges from test performance
- Unexpected demographic or categorical biases in outputs
- Test performance improves but user satisfaction doesn't
- Manual spot-checks reveal ground truth errors

**Phase mapping:**
- Phase 2 (Ground Truth Dataset) - Rigorous validation before trusting dataset
- Ongoing maintenance across all phases

---

### Pitfall 4: Evaluating Individual Prompts Instead of Entire System Performance

**What goes wrong:** Testing only the LLM prompt in isolation, ignoring preprocessing, image parsing, entity extraction, normalization, and post-processing. The prompt might work but the system fails due to other components.

**Why it happens:** Prompt engineering feels like the "core" problem. Teams fixate on prompt quality and treat other components as implementation details.

**Consequences:**
- High prompt evaluation scores, poor end-to-end performance
- Bugs hide in preprocessing (image quality) or post-processing (entity normalization)
- False confidence: "Prompt works in tests, fails in production"
- Cannot identify which component causes failures
- Vision-specific issues (image quality, resolution, format) go undetected

**Prevention:**
- Test at multiple levels:
  - Unit level: Prompt only (controlled text input)
  - Integration level: Image → text extraction → LLM → parsed output
  - System level: Full pipeline with real images
- Track metrics per component: vision extraction quality, LLM response quality, final output accuracy
- Separate test suites: text-based prompts vs. image-based full pipeline
- Monitor image-specific failure modes (poor OCR, layout confusion)

**Detection:**
- Unit tests pass, integration tests fail
- Works with clean text input, fails with real image inputs
- Cannot isolate root cause of failures
- Different failure rates between text-mode and image-mode testing

**Phase mapping:**
- Phase 1 (Core Testing Infrastructure) - Design for multi-level testing
- Phase 4 (Image-based Testing) - Add vision-specific evaluation

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or limit scalability.

### Pitfall 5: No Prompt Version Control or Regression Testing

**What goes wrong:** Prompts are edited directly without versioning. Changes improve one test case but silently break others. No way to rollback or compare prompt versions systematically.

**Why it happens:** Prompts feel like "configuration" not "code." Teams iterate rapidly without version discipline.

**Consequences:**
- Regressions go undetected until production
- Cannot A/B test prompt versions reliably
- Lost institutional knowledge: "What was the old prompt that worked better for edge case X?"
- No audit trail for debugging production issues

**Prevention:**
- Semantic versioning for prompts (1.0.0 → 1.1.0 for improvements, 2.0.0 for breaking changes)
- Git-based version control with descriptive commit messages
- Regression test suite: New prompt version must not decrease performance on existing test cases
- CI/CD integration: Fail build if regression detected
- Document rationale for each version change
- Automated backtesting against previous test runs

**Detection:**
- Team members say "the prompt used to work better"
- Cannot explain why performance changed
- Multiple people editing same prompt simultaneously
- No record of what changed when

**Phase mapping:** Phase 3 (Batch Testing) - Implement before scaling test suite

---

### Pitfall 6: Batch Testing Without Rate Limiting and Cost Controls

**What goes wrong:** Running hundreds of test cases hits API rate limits, causes test runs to fail mid-batch, and racks up unexpected API costs (especially with vision models).

**Why it happens:** Eager to test at scale without considering API infrastructure constraints. Claude API has rate limits (tokens/minute, requests/minute) and vision tokens are expensive.

**Consequences:**
- Test runs fail due to 429 rate limit errors
- Partial results require manual intervention
- Unpredictable test run duration
- Budget overruns on API costs (vision API calls are ~5x more expensive)
- Cannot run full test suite in CI/CD reliably

**Prevention:**
- Implement exponential backoff with retry logic for rate limit errors
- Request rate limit increases for testing workloads from Anthropic
- Use Anthropic's Batch API (50% cost savings) for non-urgent test runs
- Token budgeting: Estimate costs before batch runs
- Parallel request throttling: Limit concurrent API calls
- Separate test tiers: Critical (runs always) vs. Full (runs nightly with budget)
- Cache LLM responses for test cases to avoid redundant API calls

**Detection:**
- Test runs fail with 429 errors
- API bills spike unexpectedly
- Test suite cannot complete within CI/CD time limits
- Engineers avoid running full test suite due to cost concerns

**Phase mapping:** Phase 3 (Batch Testing) - Critical before scaling beyond 10 test cases

---

### Pitfall 7: Ignoring Vision-Specific Failure Modes for Image-Based Testing

**What goes wrong:** Assuming image-based prompts work like text-based prompts. Vision models have unique failure modes: cannot recognize text in poor quality images, get confused by complex layouts, fail at counting/spatial reasoning.

**Why it happens:** Teams extrapolate from text-based LLM experience without understanding multimodal model limitations.

**Consequences:**
- Test cases fail for vision-specific reasons (image quality, layout) not prompt quality
- No way to distinguish vision failures from prompt failures
- Edge cases go untested: handwritten text, low contrast, unusual layouts
- Performance varies dramatically by image characteristics

**Prevention:**
- Test image preprocessing pipeline separately: resolution, format, compression
- Understand vision model limitations (Meta 2026 research: scaling improves perception but not reasoning)
- Test vision-specific challenges:
  - Handwritten vs. printed text
  - Multi-column layouts
  - Watermarks and overlays
  - Poor lighting/contrast
- Separate metrics: vision extraction quality vs. final output quality
- Document known vision limitations for the model (e.g., digit recognition failures)

**Detection:**
- High failure rates on visually complex images
- Same content works in text form, fails in image form
- Inconsistent results based on image quality not content quality
- Cannot reproduce text-based test results with image inputs

**Phase mapping:** Phase 4 (Image-based Testing) - Vision-specific test harness needed

---

### Pitfall 8: Using Traditional NLP Metrics (BLEU/ROUGE) for LLM Evaluation

**What goes wrong:** Applying BLEU, ROUGE, or Levenshtein distance to LLM outputs. These metrics reward n-gram overlap but miss semantic equivalence. Semantically correct outputs score poorly.

**Why it happens:** These metrics are well-known, easy to compute, and feel scientific. Teams borrow from machine translation / summarization evaluation without questioning applicability.

**Consequences:**
- Meaningless scores: Low BLEU score for semantically perfect output
- Optimization perverse incentives: Prompts that copy ground truth phrasing score higher than better paraphrases
- Cannot detect hallucinations or semantic errors
- Research consensus (2026): "Too inaccurate for most LLM evaluation criteria"

**Prevention:**
- For structured extraction: Compare extracted data structures, not surface text
- For entity extraction: Use entity-level F1 (precision/recall on extracted entities)
- For open-ended text: Use LLM-as-judge for semantic evaluation
- Avoid BLEU/ROUGE entirely unless task is specifically about lexical similarity
- Document why semantic equivalence matters more than surface similarity

**Detection:**
- Evaluation scores don't correlate with human judgments
- Low scores on obviously correct outputs
- High scores on subtly wrong outputs
- Team ignores metrics because they don't make sense

**Phase mapping:** Phase 1 (Core Testing Infrastructure) - Choose right metrics from the start

---

### Pitfall 9: Inadequate Test Dataset Coverage (Size and Diversity)

**What goes wrong:** Test dataset is too small (<20 cases), lacks edge cases, or over-represents common scenarios. Statistical significance is impossible, and rare failures go undetected.

**Why it happens:** Manual test case creation is tedious. Teams create happy-path examples and stop.

**Consequences:**
- False confidence from small sample sizes
- Rare edge cases cause production failures
- Cannot detect subtle regressions
- Overfitting to test set
- Bias toward certain genres, eras, or festival types

**Prevention:**
- Minimum dataset size: 50-100 test cases for statistical validity
- Systematic coverage:
  - Happy path (60%): Common festival lineup formats
  - Edge cases (30%): Unusual layouts, multi-day festivals, special characters
  - Adversarial (10%): Ambiguous, malformed, or tricky inputs
- Diversity dimensions for festival lineups:
  - Different festival types (music, film, food)
  - Different date formats
  - Different name formats (stage names, band names, solo artists)
  - Image quality variations
  - Layout variations (posters, websites, programs)
- Held-out validation set (20%) never used for development

**Detection:**
- Tests pass but production fails frequently
- New edge cases discovered every week in production
- Cannot explain why some failures weren't caught
- Statistical analysis shows insufficient sample size

**Phase mapping:** Phase 2 (Ground Truth Dataset) - Build comprehensive coverage upfront

---

### Pitfall 10: No Mechanism to Handle LLM-as-Judge Biases

**What goes wrong:** Using an LLM to evaluate outputs introduces systematic biases: position bias (prefers first option), verbosity bias (rewards longer answers), self-preference (favors outputs similar to own style).

**Why it happens:** LLM-as-judge feels like an elegant solution - use AI to evaluate AI. Teams ignore that judges have biases.

**Consequences:**
- Position bias: 40% inconsistency in GPT-4 judgments based on answer order
- Verbosity bias: ~15% score inflation for longer outputs
- Cannot detect when judge is systematically wrong
- Evaluation scores drift as judge model changes

**Prevention:**
- Swap ordering: Evaluate both (A,B) and (B,A) orderings, average scores
- Explicit anti-verbosity instructions: Reward conciseness in rubric
- Use 1-4 scales instead of binary (better calibration)
- Multi-judge: Use multiple LLM judges, compare agreement
- Human validation: Spot-check judge decisions on 10-20% of cases
- Ground LLM judge in factual criteria not subjective quality

**Detection:**
- Judgment flips when you swap answer order
- Longer outputs consistently score higher regardless of quality
- Human reviewers disagree with LLM judge frequently
- Judge scores don't correlate with production performance

**Phase mapping:**
- Phase 5 (LLM-as-Judge - Optional) - Only if semantic evaluation needed
- Not applicable if using strict entity extraction comparison

---

## Minor Pitfalls

Mistakes that cause annoyance or inefficiency but are easily fixable.

### Pitfall 11: Not Normalizing Extracted Entities Before Comparison

**What goes wrong:** Comparing raw extracted artist names: "Kendrick Lamar" vs. "Kendrick Lamar " (trailing space) vs. "kendrick lamar" - all marked as different entities.

**Why it happens:** Focusing on extraction quality, forgetting that string normalization is necessary for meaningful comparison.

**Consequences:**
- False negatives: Correct extractions marked wrong due to whitespace/casing
- Duplicate entity detection fails
- Manual review burden increases

**Prevention:**
- Standardize normalization pipeline:
  - Lowercase or title case (choose one consistently)
  - Strip leading/trailing whitespace
  - Normalize internal whitespace (multiple spaces → single space)
  - Unicode normalization (é vs. e + combining accent)
  - Remove special characters if not semantically meaningful
- Apply same normalization to ground truth and extracted entities
- Document normalization rules explicitly

**Detection:**
- High failure rate on manual review reveals formatting-only differences
- Same artist name in different formats marked as different
- Engineers manually editing test cases to match formatting

**Phase mapping:** Phase 1 (Core Testing Infrastructure) - Define normalization rules early

---

### Pitfall 12: Tightly Coupling Evaluation Logic to Specific Prompting Strategies

**What goes wrong:** Evaluation code assumes specific output format from current prompt. When testing new prompting strategies (few-shot, chain-of-thought, structured output), evaluation breaks.

**Why it happens:** Building evaluation for current prompt, not anticipating experimentation.

**Consequences:**
- Cannot compare different prompting approaches fairly
- Changing prompt requires rewriting evaluation logic
- Blocks experimentation and iteration

**Prevention:**
- Design evaluation to accept multiple output formats
- Parse output flexibly: Extract entities regardless of surrounding text structure
- Separate parsing logic from comparison logic
- Strategy-agnostic test cases: Define expected entities, not expected format
- Use structured output modes when available (JSON mode) for consistent parsing

**Detection:**
- New prompt strategy requires eval code changes
- Evaluation suite only works with one specific prompt format
- Cannot run A/B tests between different prompting approaches

**Phase mapping:** Phase 1 (Core Testing Infrastructure) - Build flexible evaluation from start

---

### Pitfall 13: No Test Result Visualization or Debugging Support

**What goes wrong:** Test results shown as pass/fail counts. When tests fail, no easy way to see what the LLM actually produced vs. expected, or why it was marked wrong.

**Consequences:**
- Slow debugging: Must manually inspect logs
- Cannot spot patterns in failures
- Hard to communicate issues to team
- Wastes time on preventable investigation

**Prevention:**
- Rich test output:
  - Show actual vs. expected side-by-side
  - Highlight specific differences (missing entities, extra entities, formatting)
  - Include full LLM response for context
  - Show intermediate parsing steps
- Test result dashboard: Filter by pass/fail, test case type, failure reason
- Export test results to HTML or markdown for sharing
- Diff visualization for entity lists

**Detection:**
- Team frequently asks "what did the model actually say?"
- Long debugging sessions to understand test failures
- Copy-pasting test outputs into documents for review

**Phase mapping:** Phase 3 (Batch Testing) - Add when running multiple tests regularly

---

### Pitfall 14: Forgetting to Test Both Text-Based and Image-Based Modes Separately

**What goes wrong:** Building unified test suite that mixes text and image inputs. Failures don't clearly indicate whether problem is vision extraction or prompt logic.

**Consequences:**
- Cannot isolate root cause
- Image processing bugs mask prompt quality issues
- Slower iteration on prompt improvements

**Prevention:**
- Two separate test modes:
  1. Text-based: Direct text input to prompt (tests prompt logic only)
  2. Image-based: Full pipeline with images (tests vision + prompt)
- Run text-based tests more frequently (faster, cheaper)
- Run image-based tests as integration tests (slower, more expensive)
- Compare pass rates: Text vs. image mode highlights vision-specific issues

**Detection:**
- Unclear whether failures are vision or prompt issues
- Debugging requires testing both modes manually
- Text-only prompt changes affect image test results unexpectedly

**Phase mapping:**
- Phase 1 (Core Testing Infrastructure) - Text-based tests first
- Phase 4 (Image-based Testing) - Add separate image test suite

---

### Pitfall 15: Ignoring Test Execution Time and Developer Experience

**What goes wrong:** Test suite takes 10+ minutes to run. Developers stop running tests locally, only run in CI/CD. Slow feedback loop kills iteration speed.

**Consequences:**
- Developers commit without testing
- Longer time to detect issues
- Frustration and reduced productivity

**Prevention:**
- Tiered testing strategy:
  - Smoke tests (<1 minute): 10 critical test cases, run locally
  - Standard tests (2-5 minutes): 50 test cases, run on each commit
  - Full suite (10-30 minutes): All test cases, run nightly or pre-release
- Parallel test execution where possible
- Cache LLM responses for deterministic test cases
- Progress indicators: Show test execution progress

**Detection:**
- Developers complain about slow tests
- Tests only run in CI/CD, not locally
- Test runs take >5 minutes for standard suite

**Phase mapping:** Phase 3 (Batch Testing) - Optimize before test suite grows large

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|---------------|------------|----------|
| Core Testing Infrastructure (Phase 1) | Exact string matching | Design for normalized entity comparison from day 1 | CRITICAL |
| Core Testing Infrastructure (Phase 1) | Single-run test design | Build in multi-run aggregation and statistical thresholds | CRITICAL |
| Ground Truth Dataset (Phase 2) | Trusting unchecked annotations | Multi-annotator validation, inter-annotator agreement measurement | CRITICAL |
| Ground Truth Dataset (Phase 2) | Insufficient test coverage | Systematic coverage: happy path (60%), edge cases (30%), adversarial (10%) | HIGH |
| Batch Testing (Phase 3) | No rate limiting | Implement exponential backoff, request limit increases, use Batch API | HIGH |
| Batch Testing (Phase 3) | Slow test execution | Tiered testing strategy, caching, parallel execution | MEDIUM |
| Image-based Testing (Phase 4) | Vision failure modes ignored | Test vision extraction separately, document model limitations | HIGH |
| Image-based Testing (Phase 4) | Mixed text/image test suites | Separate test modes for isolation and debugging | MEDIUM |
| LLM-as-Judge (Phase 5 - Optional) | Position/verbosity bias | Swap orderings, anti-verbosity rubric, multi-judge validation | MEDIUM |
| All Phases | No version control for prompts | Git-based versioning, semantic versions, regression testing | HIGH |
| All Phases | Traditional NLP metrics (BLEU/ROUGE) | Use entity-level F1 or LLM-as-judge for semantic evaluation | MEDIUM |

---

## Sources

### Evaluation Strategy & Testing
- [Avoiding Common Pitfalls in LLM Evaluation](https://www.honeyhive.ai/post/avoiding-common-pitfalls-in-llm-evaluation)
- [LLM Evaluation Metrics: The Ultimate LLM Evaluation Guide](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation)
- [AI LLM Test Prompts: Best Practices for AI Evaluation](https://www.patronus.ai/llm-testing/ai-llm-test-prompts)
- [LLM-as-a-judge: Complete Guide to Using LLMs for Evaluations](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
- [Demystifying Evals for AI Agents - Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

### Ground Truth & Dataset Quality
- [Evaluating Large Language Model Systems: Metrics, Challenges, and Best Practices](https://medium.com/data-science-at-microsoft/evaluating-llm-systems-metrics-challenges-and-best-practices-664ac25be7e5)
- [Building an LLM Evaluation Framework: Best Practices](https://www.datadoghq.com/blog/llm-evaluation-framework-best-practices/)
- [Ground Truth Annotation: Ensuring Data Quality](https://www.statsig.com/perspectives/ground-truth-annotation-data-quality)
- [Ground Truth in Classification Accuracy Assessment: Myth and Reality](https://www.mdpi.com/2673-7418/4/1/5)

### Vision LLM Testing
- [A Vision Check-up for Language Models](https://arxiv.org/html/2401.01862v1)
- [Compare Multimodal AI Models on Visual Reasoning](https://research.aimultiple.com/visual-reasoning/)
- [Vision-Language Models: How They Work & Overcoming Key Challenges](https://encord.com/blog/vision-language-models-guide/)

### Nondeterminism & Flakiness
- [On the Flakiness of LLM-Generated Tests](https://arxiv.org/html/2601.08998) (January 2026)
- [LLM Testing in 2026: Top Methods and Strategies](https://www.confident-ai.com/blog/llm-testing-in-2024-top-methods-and-strategies)

### String Matching & Metrics
- [LLM Evaluation Metrics and Methods](https://www.evidentlyai.com/llm-guide/llm-evaluation-metrics)
- [Large Language Model Evaluation in '26: 10+ Metrics & Methods](https://research.aimultiple.com/large-language-model-evaluation/)

### Structured Output & JSON Validation
- [The Guide to Structured Outputs and Function Calling with LLMs](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms)
- [LLM Evaluation Techniques for JSON Outputs](https://www.promptfoo.dev/docs/guides/evaluate-json/)

### Prompt Version Control & Regression Testing
- [Automated Prompt Regression Testing with LLM-as-a-Judge and CI/CD](https://www.traceloop.com/blog/automated-prompt-regression-testing-with-llm-as-a-judge-and-ci-cd)
- [Prompt Engineering Best Practices Testing & Versioning Framework for 2026](https://www.kumohq.co/blog/prompt-engineering-best-practices)
- [Top 5 Prompt Engineering Platforms in 2026](https://www.getmaxim.ai/articles/top-5-prompt-engineering-platforms-in-2026/)

### Entity Extraction & Name Variations
- [A Survey on Recent Advances in Named Entity Recognition](https://arxiv.org/html/2401.10825v1)
- [On the Robustness of Document-Level Relation Extraction Models to Entity Name Variations](https://www.researchgate.net/publication/384216016_On_the_Robustness_of_Document-Level_Relation_Extraction_Models_to_Entity_Name_Variations)

### Batch Testing & Cost Management
- [How to Systematically Test and Improve Your LLM Prompts](https://www.helicone.ai/blog/test-your-llm-prompts)
- [Top 5 Prompt Testing & Optimization Tools in 2026](https://www.getmaxim.ai/articles/top-5-prompt-testing-optimization-tools-in-2026/)

### Precision, Recall & False Positives/Negatives
- [Accuracy vs. Precision vs. Recall in Machine Learning](https://www.evidentlyai.com/classification-metrics/accuracy-precision-recall)
- [What is F1 Score? An Essential Metric in LLM Evaluation](https://datasciencedojo.com/blog/understanding-f1-score/)
- [Transforming AI: The Power of Precision-Recall Curves](https://galileo.ai/blog/precision-recall-ai-evaluation)
