# Roadmap: Festival Lineup Prompt Evaluator

## Overview

This roadmap delivers a prompt engineering workbench for testing Claude models and system prompts against festival lineup extraction tasks. The journey progresses from foundational storage and data management, through interactive test configuration, to execution engine and results visualization. Each phase delivers a complete, verifiable capability that builds toward the core value: accurately measuring which prompt + model combination produces the most correct lineup extractions.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data** - Storage infrastructure and image handling
- [ ] **Phase 2: Test Management & Configuration** - Test case CRUD and prompt configuration
- [ ] **Phase 3: Execution & Evaluation** - Run tests and measure results
- [ ] **Phase 4: Results & Export** - Display results and export capabilities

## Phase Details

### Phase 1: Foundation & Data
**Goal**: Test data persists between sessions and images are stored locally
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Test cases persist between application restarts
  2. Images uploaded by user are stored locally and retrievable
  3. Application can reference images from test cases without re-upload
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Project foundation and test case persistence layer
- [x] 01-02-PLAN.md - Image storage with deduplication and REST API endpoints

### Phase 2: Test Management & Configuration
**Goal**: User can manage test cases and configure prompt strategies
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, PROMPT-01, PROMPT-02
**Success Criteria** (what must be TRUE):
  1. User can add test cases with festival name, image, and ground truth lineup
  2. User can edit existing test cases and delete test cases they no longer need
  3. User can see image previews in the test case list without opening each case
  4. User can paste custom system prompts into the application
  5. User can select which Claude model to use for testing
**Plans**: TBD

Plans:
- [ ] 02-01: [TBD - to be defined during phase planning]

### Phase 3: Execution & Evaluation
**Goal**: User can run tests and get accuracy measurements
**Depends on**: Phase 2
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EVAL-01, EVAL-02, EVAL-03
**Success Criteria** (what must be TRUE):
  1. User can run individual text-based tests (festival name → lineup)
  2. User can run individual image-based tests (festival image → lineup)
  3. User can run batch tests against all test cases with one action
  4. System compares extracted lineups against ground truth using strict string matching
  5. User sees percentage of artists matched for each test
  6. User sees how many tests achieved 100% accuracy
**Plans**: TBD

Plans:
- [ ] 03-01: [TBD - to be defined during phase planning]

### Phase 4: Results & Export
**Goal**: User can analyze test results and export data
**Depends on**: Phase 3
**Requirements**: RSLT-01, RSLT-02, RSLT-03
**Success Criteria** (what must be TRUE):
  1. User can view results table showing expected vs actual lineup for each test
  2. User can see pass/fail status at a glance for each test
  3. User can export results as CSV or JSON for external analysis
**Plans**: TBD

Plans:
- [ ] 04-01: [TBD - to be defined during phase planning]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data | 2/2 | Complete | 2026-01-22 |
| 2. Test Management & Configuration | 0/0 | Not started | - |
| 3. Execution & Evaluation | 0/0 | Not started | - |
| 4. Results & Export | 0/0 | Not started | - |

---
*Roadmap created: 2026-01-22*
*Last updated: 2026-01-22 - Phase 1 complete*
