# Requirements: Festival Lineup Prompt Evaluator

**Defined:** 2026-01-26
**Core Value:** Accurately measure which combination of system prompt + Claude model produces the most correct festival lineup extractions.

## v1.1 Requirements

Requirements for Web Search Eval milestone. Each maps to roadmap phases.

### Test Management

- [ ] **WSTEST-01**: User can create web search test case with festival name, year, and ground truth lineup
- [ ] **WSTEST-02**: User can edit web search test case
- [ ] **WSTEST-03**: User can delete web search test case
- [ ] **WSTEST-04**: Web search test cases persist between sessions

### Execution

- [ ] **WSEXEC-01**: User can execute single web search test (festival name + year -> Claude web search -> extracted lineup)
- [ ] **WSEXEC-02**: User can batch execute all web search tests with progress tracking
- [ ] **WSEXEC-03**: User can cancel batch execution

### Results

- [ ] **WSRES-01**: User can view web search test results with pass/fail status per test
- [ ] **WSRES-02**: User can see aggregate metrics (percentage match, perfect score count)
- [ ] **WSRES-03**: User can export web search results as JSON

### UI

- [ ] **WSUI-01**: User can switch between Image Eval and Web Search Eval via tabs
- [ ] **WSUI-02**: User can configure independent system prompt for web search eval
- [ ] **WSUI-03**: User can select model for web search eval independently
- [ ] **WSUI-04**: Web search prompt and model persist in localStorage

## Future Requirements

Deferred to later milestones.

### Evaluation Enhancements

- **EVAL-01**: Test run history with comparison
- **EVAL-02**: Cost and latency tracking per test
- **EVAL-03**: Fuzzy matching option for artist names

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cross-tab batch execution | Keep scopes separate; run one eval type at a time |
| Fuzzy matching | Strict string comparison only (v1.0 decision) |
| Combined results view | Each eval type has its own results |
| Web search for image eval | Image eval uses vision, not web search |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WSUI-01 | Phase 5 | Complete |
| WSUI-02 | Phase 5 | Complete |
| WSUI-03 | Phase 5 | Complete |
| WSUI-04 | Phase 5 | Complete |
| WSTEST-01 | Phase 6 | Pending |
| WSTEST-02 | Phase 6 | Pending |
| WSTEST-03 | Phase 6 | Pending |
| WSTEST-04 | Phase 6 | Pending |
| WSEXEC-01 | Phase 7 | Pending |
| WSEXEC-02 | Phase 7 | Pending |
| WSEXEC-03 | Phase 7 | Pending |
| WSRES-01 | Phase 7 | Pending |
| WSRES-02 | Phase 7 | Pending |
| WSRES-03 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-01-26*
*Last updated: 2026-01-26 after roadmap creation*
