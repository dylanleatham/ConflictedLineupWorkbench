# Roadmap: Festival Lineup Prompt Evaluator

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-01-24)
- **v1.1 Web Search Eval** - Phases 5-7 (in progress)

## Overview

v1.1 adds web search evaluation alongside the existing image-based eval. Users get a separate tab with independent test cases, prompts, and model selection. The milestone delivers CRUD for web search tests, execution with Claude web search tools, and results display with metrics and export.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phases 1-4: v1.0 MVP** - Image eval workbench (shipped)
- [x] **Phase 5: UI Foundation** - Tab structure and independent web search config
- [ ] **Phase 6: Test Management** - CRUD for web search test cases
- [ ] **Phase 7: Execution and Results** - Run web search tests and display results

## Phase Details

### v1.0 MVP (Phases 1-4) - SHIPPED 2026-01-24

v1.0 delivered image-based lineup extraction eval with test case management, batch execution, and results export.

### Phase 5: UI Foundation
**Goal**: User can access web search eval as a separate workspace with independent configuration
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: WSUI-01, WSUI-02, WSUI-03, WSUI-04
**Success Criteria** (what must be TRUE):
  1. User can switch between Image Eval and Web Search Eval tabs
  2. User can configure a system prompt specific to web search eval
  3. User can select a model for web search eval independently from image eval
  4. Web search prompt and model selection persist across page refreshes
**Plans**: 1 plan

Plans:
- [x] 05-01-PLAN.md — Tabbed workspace UI with independent prompt config per workspace

### Phase 6: Test Management
**Goal**: User can create, edit, and delete web search test cases that persist
**Depends on**: Phase 5
**Requirements**: WSTEST-01, WSTEST-02, WSTEST-03, WSTEST-04
**Success Criteria** (what must be TRUE):
  1. User can create a web search test case with festival name, year, and ground truth lineup
  2. User can edit an existing web search test case
  3. User can delete a web search test case
  4. Web search test cases persist between browser sessions
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Web search test case CRUD with localStorage persistence
- [ ] 06-02-PLAN.md — Fix navigation paths (gap closure)

### Phase 7: Execution and Results
**Goal**: User can run web search tests and view results with metrics
**Depends on**: Phase 6
**Requirements**: WSEXEC-01, WSEXEC-02, WSEXEC-03, WSRES-01, WSRES-02, WSRES-03
**Success Criteria** (what must be TRUE):
  1. User can execute a single web search test (festival name + year sent to Claude with web search tools)
  2. User can batch execute all web search tests with visible progress
  3. User can cancel a running batch execution
  4. User can view pass/fail status for each completed test
  5. User can see aggregate metrics (percentage match, perfect score count)
  6. User can export web search results as JSON
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v1.0 | - | Complete | 2026-01-24 |
| 5. UI Foundation | v1.1 | 1/1 | Complete | 2026-01-26 |
| 6. Test Management | v1.1 | 1/2 | In Progress | - |
| 7. Execution and Results | v1.1 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-26*
*Last updated: 2026-01-27*
