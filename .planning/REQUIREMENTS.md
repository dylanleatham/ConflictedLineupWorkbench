# Requirements: Festival Lineup Prompt Evaluator

**Defined:** 2026-01-22
**Core Value:** Accurately measure which combination of system prompt + Claude model produces the most correct festival lineup extractions.

## v1 Requirements

### Test Management

- [ ] **TEST-01**: User can add test cases with festival name, image, and ground truth lineup
- [ ] **TEST-02**: User can edit existing test cases
- [ ] **TEST-03**: User can delete test cases
- [ ] **TEST-04**: User can view image preview in test case list

### Prompt Configuration

- [ ] **PROMPT-01**: User can paste a custom system prompt
- [ ] **PROMPT-02**: User can select which Claude model to use

### Execution

- [ ] **EXEC-01**: User can run text-based tests (festival name → lineup)
- [ ] **EXEC-02**: User can run image-based tests (festival image → lineup)
- [ ] **EXEC-03**: User can run batch tests against all test cases

### Evaluation

- [ ] **EVAL-01**: System compares results using strict string matching
- [ ] **EVAL-02**: System calculates percentage of artists matched per test
- [ ] **EVAL-03**: System shows how many tests achieved 100% accuracy

### Results

- [ ] **RSLT-01**: User can view results table with expected vs actual output
- [ ] **RSLT-02**: User can see pass/fail status for each test
- [ ] **RSLT-03**: User can export results as CSV/JSON

### Persistence

- [ ] **DATA-01**: Test cases persist between sessions
- [ ] **DATA-02**: Images stored locally and referenced by test cases

## v2 Requirements

### History & Tracking

- **HIST-01**: User can view previous test run results
- **HIST-02**: User can compare results across runs

### Advanced Evaluation

- **ADVL-01**: System provides per-artist matching breakdown
- **ADVL-02**: System supports partial credit scoring (fuzzy matching)

### Integration

- **INTG-01**: CLI interface for scriptable access
- **INTG-02**: Cost tracking per test run
- **INTG-03**: Speed/latency tracking per request

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fuzzy matching | User requires strict string comparison for evaluation |
| Production monitoring | This is a testing/iteration tool, not production infrastructure |
| Multi-user collaboration | Single-user developer tool |
| Auto-prompt optimization | Manual iteration workflow preferred |
| LLM-as-judge evaluation | Stick to deterministic string comparison |
| Real-time streaming | Batch testing doesn't need live updates |
| Cloud deployment | Local-first tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| PROMPT-01 | Phase 2 | Pending |
| PROMPT-02 | Phase 2 | Pending |
| EXEC-01 | Phase 3 | Pending |
| EXEC-02 | Phase 3 | Pending |
| EXEC-03 | Phase 3 | Pending |
| EVAL-01 | Phase 3 | Pending |
| EVAL-02 | Phase 3 | Pending |
| EVAL-03 | Phase 3 | Pending |
| RSLT-01 | Phase 4 | Pending |
| RSLT-02 | Phase 4 | Pending |
| RSLT-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after roadmap creation*
