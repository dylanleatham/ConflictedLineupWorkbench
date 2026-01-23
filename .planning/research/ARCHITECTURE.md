# Architecture Patterns: Prompt Evaluation Tool

**Domain:** LLM Prompt Testing & Evaluation Workbench
**Researched:** 2026-01-22
**Stack Context:** Python + FastAPI backend, React frontend, Claude API, Local storage
**Confidence:** HIGH (verified with official FastAPI template, LLM evaluation frameworks, and 2026 industry patterns)

## Executive Summary

Modern prompt evaluation tools in 2026 follow a layered architecture separating experimentation, evaluation, storage, and orchestration concerns. The architecture must handle async LLM API calls, batch processing, multimodal inputs (text + images), and flexible evaluation metrics. FastAPI's async capabilities make it ideal for I/O-bound LLM workloads, while React provides responsive UI for test case management and results visualization.

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                            │
├─────────────────────────────────────────────────────────────────┤
│  Test Case Manager  │  Prompt Editor  │  Results Dashboard     │
│  - Create tests     │  - Edit prompts │  - View evaluations    │
│  - Upload images    │  - Manage vars  │  - Compare strategies  │
│  - Organize suites  │  - Version ctrl │  - Export results      │
└──────────────────┬──────────────────────────────────────────────┘
                   │ REST API (JSON)
                   │ WebSocket (real-time updates)
┌──────────────────┴──────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│                    API LAYER (Routes)                            │
│  /test-cases  │  /prompts  │  /executions  │  /evaluations     │
├─────────────────────────────────────────────────────────────────┤
│                  ORCHESTRATION LAYER                             │
│  Test Executor    │  Batch Processor  │  Result Aggregator     │
│  - Queue mgmt     │  - Parallel exec  │  - Metrics calc        │
│  - Job tracking   │  - Rate limiting  │  - Comparison logic    │
├─────────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                                 │
│  LLM Client       │  Evaluator        │  Storage Service       │
│  - Claude API     │  - String match   │  - File I/O            │
│  - Image upload   │  - Custom metrics │  - JSON persistence    │
│  - Retry logic    │  - Scoring        │  - Version control     │
├─────────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                            │
│  Job Queue        │  File Storage     │  Cache                 │
│  - In-memory      │  - Local images   │  - Results cache       │
│  - Async tasks    │  - Test cases     │  - Prompt cache        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Frontend Components (React)

| Component | Responsibility | Communicates With | Key Features |
|-----------|---------------|-------------------|--------------|
| **Test Case Manager** | CRUD for test cases, organize test suites | Backend API (`/test-cases`) | Folder structure, tagging, bulk import/export CSV |
| **Prompt Editor** | Edit prompt templates with variables | Backend API (`/prompts`) | Template syntax, variable substitution, version history |
| **Image Uploader** | Upload and manage festival lineup images | Backend API (`/images`) | Preview, drag-drop, metadata extraction |
| **Execution Controller** | Trigger batch runs, monitor progress | Backend API + WebSocket (`/executions`) | Start/stop runs, real-time progress, job status |
| **Results Dashboard** | Visualize evaluation results, compare strategies | Backend API (`/evaluations`) | Tables, charts, filtering, export |
| **Strategy Comparator** | A/B compare different prompting approaches | Evaluation Service | Side-by-side comparison, diff highlighting |

### Backend Components (FastAPI)

| Component | Responsibility | Communicates With | Dependencies |
|-----------|---------------|-------------------|--------------|
| **API Routes** | HTTP endpoints for CRUD operations | Frontend, all services | Pydantic models, auth middleware |
| **Test Executor** | Orchestrate test execution workflow | LLM Client, Queue, Storage | Async queue, job tracker |
| **Batch Processor** | Execute multiple tests in parallel batches | LLM Client, Evaluator | Async worker pool, rate limiter |
| **LLM Client** | Interface with Claude API (text + image) | Claude API, Image Storage | httpx (async), retry logic, token counting |
| **Evaluator Service** | Apply evaluation metrics to results | None (pure function) | String matching, custom validators |
| **Storage Service** | Persist test cases, results, images | File system, JSON files | File I/O, atomic writes, indexing |
| **WebSocket Manager** | Real-time updates for running jobs | Frontend, Test Executor | FastAPI WebSocket, event broadcasting |
| **Result Aggregator** | Calculate metrics, comparisons, summaries | Evaluator, Storage | Pandas (data manipulation), statistics |

## Data Flow

### 1. Test Case Creation Flow

```
User creates test case in UI
  → React form submits to POST /test-cases
    → API validates with Pydantic model
      → Storage Service writes to filesystem (test_cases/{id}.json)
        → Returns test case ID
          → React updates UI with new test case
```

**Key Decisions:**
- JSON file-per-test-case for simplicity (vs database)
- Schema validation at API boundary via Pydantic
- Atomic file writes to prevent corruption

### 2. Image Upload Flow

```
User selects image file
  → React uploads to POST /images (multipart/form-data)
    → API validates file type/size
      → Storage Service saves to images/{hash}.{ext}
        → Returns image ID and URL
          → React displays preview
            → Associates image ID with test case
```

**Key Decisions:**
- Content-addressed storage (hash-based filenames) prevents duplicates
- Immediate upload (not lazy loading) for better UX
- Base64 encoding for API transmission to Claude

### 3. Batch Execution Flow

```
User triggers batch run of test suite
  → React calls POST /executions with test_case_ids[]
    → Test Executor creates job record
      → Enqueues tasks to async job queue
        → Returns job_id immediately
          → WebSocket connection established for updates

Background async workers:
  For each test case in parallel (rate-limited):
    → Batch Processor fetches test case
      → Loads image if present
        → LLM Client calls Claude API with prompt + image
          → Receives structured response
            → Evaluator Service applies metrics
              → Result stored to results/{job_id}/{test_id}.json
                → WebSocket broadcasts progress update
                  → React updates progress bar

When all complete:
  → Result Aggregator calculates summary stats
    → Storage saves to results/{job_id}/summary.json
      → WebSocket sends completion event
        → React redirects to results dashboard
```

**Key Decisions:**
- Async/await throughout for I/O-bound operations
- Job queue prevents overwhelming Claude API (rate limiting)
- WebSocket for real-time feedback (not polling)
- Per-test results + summary for incremental display
- Parallel execution with configurable concurrency

### 4. Evaluation Flow

```
Test result received from LLM
  → Evaluator Service extracts expected output from test case
    → Applies configured metrics:
      - Exact string match (case-sensitive/insensitive)
      - Contains substring
      - Regex pattern match
      - Custom validator functions
    → Calculates pass/fail + confidence scores
      → Returns evaluation record
        → Merged with LLM response
          → Persisted as complete result
```

**Key Decisions:**
- Evaluator is pure function (no side effects) for testability
- Configurable metric pipelines (chain multiple validators)
- Store raw LLM response + evaluation separately for re-evaluation

### 5. Results Comparison Flow

```
User selects multiple strategies to compare
  → React calls GET /evaluations/compare?job_ids=1,2,3
    → Result Aggregator loads all job summaries
      → Groups by test case ID
        → Computes comparison metrics:
          - Pass rate per strategy
          - Average confidence scores
          - Time to complete
          - Cost (token usage)
        → Returns comparison matrix
          → React renders side-by-side table + charts
```

**Key Decisions:**
- Read-time aggregation (not pre-computed) for flexibility
- Comparison API separate from individual results
- Frontend handles visualization (backend returns data)

## Patterns to Follow

### Pattern 1: Async/Await Throughout Stack

**What:** Use async/await for all I/O operations (API calls, file I/O, LLM requests)

**When:** Always for FastAPI endpoints and LLM client calls

**Why:** LLM API calls are I/O-bound (network latency dominates). Async allows single process to handle thousands of concurrent requests efficiently without blocking.

**Example:**
```python
# FastAPI endpoint
@app.post("/executions")
async def create_execution(test_case_ids: list[str]):
    job_id = await test_executor.run_batch(test_case_ids)
    return {"job_id": job_id}

# LLM Client
class ClaudeClient:
    async def complete(self, prompt: str, image: bytes | None = None):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=self._build_payload(prompt, image)
            )
            return response.json()
```

### Pattern 2: Job Queue with Backpressure

**What:** Use async job queue (asyncio.Queue or Redis Queue) with rate limiting to prevent overwhelming LLM API

**When:** Batch execution of multiple test cases

**Why:** Claude API has rate limits (requests/minute, tokens/minute). Queue ensures we respect limits and can retry failures.

**Example:**
```python
class BatchProcessor:
    def __init__(self, concurrency: int = 5, rpm_limit: int = 50):
        self.queue = asyncio.Queue()
        self.semaphore = asyncio.Semaphore(concurrency)
        self.rate_limiter = RateLimiter(rpm_limit)

    async def process_batch(self, test_cases: list[TestCase]):
        tasks = [self._process_one(tc) for tc in test_cases]
        results = await asyncio.gather(*tasks)
        return results

    async def _process_one(self, test_case: TestCase):
        async with self.semaphore:  # Limit concurrency
            await self.rate_limiter.acquire()  # Respect rate limits
            result = await self.llm_client.complete(test_case.prompt)
            return await self.evaluator.evaluate(result, test_case)
```

### Pattern 3: FastAPI Dependency Injection for Resource Management

**What:** Use FastAPI's dependency injection to manage LLM client, storage connections, and other stateful resources

**When:** For any resource that needs lifecycle management (initialization, connection pooling, cleanup)

**Why:** Prevents recreating expensive resources on each request. Ensures proper cleanup on shutdown.

**Example:**
```python
# Dependencies
def get_llm_client() -> ClaudeClient:
    return ClaudeClient(api_key=settings.CLAUDE_API_KEY)

def get_storage() -> StorageService:
    return StorageService(base_path=settings.DATA_DIR)

# Routes use dependency injection
@app.post("/executions")
async def create_execution(
    test_case_ids: list[str],
    llm_client: ClaudeClient = Depends(get_llm_client),
    storage: StorageService = Depends(get_storage)
):
    executor = TestExecutor(llm_client, storage)
    job_id = await executor.run_batch(test_case_ids)
    return {"job_id": job_id}
```

### Pattern 4: WebSocket for Real-Time Updates

**What:** Use FastAPI WebSocket endpoints to push execution progress to frontend in real-time

**When:** Long-running batch executions where user needs progress feedback

**Why:** Polling is inefficient and increases latency. WebSocket provides instant updates.

**Example:**
```python
# Backend
@app.websocket("/ws/executions/{job_id}")
async def execution_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    async for update in test_executor.subscribe(job_id):
        await websocket.send_json({
            "type": "progress",
            "completed": update.completed,
            "total": update.total,
            "current_test": update.current_test
        })

# Frontend (React)
const ws = new WebSocket(`ws://localhost:8000/ws/executions/${jobId}`);
ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    setProgress(update.completed / update.total);
};
```

### Pattern 5: Content-Addressed Image Storage

**What:** Store images using hash of content as filename (e.g., `sha256(image)`.jpg)

**When:** Managing uploaded festival lineup images

**Why:** Automatic deduplication (same image uploaded twice = one file), immutable storage (hash never changes), cache-friendly.

**Example:**
```python
import hashlib
from pathlib import Path

async def store_image(image_data: bytes, original_filename: str) -> str:
    # Hash content
    content_hash = hashlib.sha256(image_data).hexdigest()
    extension = Path(original_filename).suffix

    # Store with hash as filename
    image_path = settings.IMAGE_DIR / f"{content_hash}{extension}"

    # Write only if not exists (deduplication)
    if not image_path.exists():
        async with aiofiles.open(image_path, 'wb') as f:
            await f.write(image_data)

    return content_hash
```

### Pattern 6: Pydantic Models for API Validation

**What:** Use Pydantic models to define request/response schemas with automatic validation

**When:** All API endpoints (FastAPI uses Pydantic by default)

**Why:** Type safety, automatic OpenAPI docs, validation errors are clear, serialization is automatic.

**Example:**
```python
from pydantic import BaseModel, Field

class TestCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=100)
    prompt_template: str
    expected_output: str
    image_id: str | None = None
    variables: dict[str, str] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Extract Coachella 2024 lineup",
                "prompt_template": "Extract festival lineup from image",
                "expected_output": "Headliners: Bad Bunny, Blackpink, Frank Ocean"
            }
        }

@app.post("/test-cases", response_model=TestCase)
async def create_test_case(test_case: TestCase):
    # Pydantic already validated test_case
    await storage.save(test_case)
    return test_case
```

### Pattern 7: Separation of Evaluation from Execution

**What:** Decouple test execution (calling LLM) from evaluation (scoring results)

**When:** Always - treat as separate concerns

**Why:** Allows re-evaluating results without re-running expensive LLM calls. Enables comparing different evaluation metrics on same result set.

**Example:**
```python
# Execute once
result = await llm_client.complete(prompt, image)
await storage.save_result(job_id, test_id, result)

# Evaluate multiple times with different metrics
for metric in [ExactMatch(), ContainsAll(), RegexMatch()]:
    evaluation = metric.evaluate(result, test_case.expected_output)
    await storage.save_evaluation(job_id, test_id, metric.name, evaluation)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Synchronous LLM API Calls

**What:** Using synchronous HTTP client (requests) to call Claude API in FastAPI

**Why bad:** Blocks worker thread during network I/O (LLM calls can take 2-10 seconds). Single worker can only handle 6-30 requests/minute instead of hundreds.

**Consequences:** Poor throughput, cannot scale batch processing, timeouts under load

**Instead:** Use async HTTP client (httpx, aiohttp) with async/await

```python
# BAD - blocks worker
import requests
def call_llm(prompt):
    response = requests.post("https://api.anthropic.com/v1/messages", json={"prompt": prompt})
    return response.json()

# GOOD - async
import httpx
async def call_llm(prompt):
    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.anthropic.com/v1/messages", json={"prompt": prompt})
        return response.json()
```

### Anti-Pattern 2: Frontend Polling for Job Status

**What:** React component polls GET /executions/{job_id}/status every 1-2 seconds

**Why bad:** Increased server load, higher latency (up to polling interval), wasted bandwidth for unchanged status

**Consequences:** Sluggish UI, backend receives 30-60 requests per minute per user

**Instead:** Use WebSocket for server-push updates

### Anti-Pattern 3: Storing Evaluation Config in Code

**What:** Hard-coding evaluation metrics and thresholds in Python code

**Why bad:** Requires code change to adjust "expected output" or add new metric. No per-test-case customization.

**Consequences:** Inflexible, requires deployment to change test cases

**Instead:** Store evaluation config in test case JSON (data-driven)

```python
# BAD
def evaluate(result):
    if result.text == "Headliners: Bad Bunny":  # Hard-coded
        return {"pass": True}

# GOOD
class TestCase(BaseModel):
    expected_output: str
    evaluation_method: Literal["exact", "contains", "regex"] = "exact"

def evaluate(result, test_case):
    if test_case.evaluation_method == "exact":
        return result.text == test_case.expected_output
    elif test_case.evaluation_method == "contains":
        return test_case.expected_output in result.text
```

### Anti-Pattern 4: Coupling Image Upload to Test Case Creation

**What:** Uploading image as part of test case creation request (large POST body)

**Why bad:** Slow API response (waits for file upload), difficult to reuse images across test cases, poor error handling

**Consequences:** Timeouts on large images, duplicate storage, bad UX

**Instead:** Separate image upload endpoint, reference images by ID in test cases

```python
# BAD
@app.post("/test-cases")
async def create_test_case(test_case: TestCase, image: UploadFile):
    image_path = await save_image(image)  # Blocks test case creation
    test_case.image_path = image_path
    return test_case

# GOOD
@app.post("/images")
async def upload_image(image: UploadFile) -> dict:
    image_id = await storage.save_image(image)
    return {"image_id": image_id}

@app.post("/test-cases")
async def create_test_case(test_case: TestCase) -> TestCase:
    # Test case references pre-uploaded image by ID
    return await storage.save_test_case(test_case)
```

### Anti-Pattern 5: Not Handling LLM API Failures

**What:** Assuming Claude API calls always succeed, no retry logic or error handling

**Why bad:** API calls can fail (rate limits, network issues, service outages). Entire batch fails if one test fails.

**Consequences:** Unreliable batch execution, lost work, poor user experience

**Instead:** Implement retry with exponential backoff, partial failure handling

```python
# BAD
async def execute_test(test_case):
    result = await llm_client.complete(test_case.prompt)  # Can fail
    return result

# GOOD
from tenacity import retry, stop_after_attempt, wait_exponential

class LLMClient:
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def complete(self, prompt: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    json=self._build_payload(prompt),
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limit
                raise  # Retry
            elif e.response.status_code >= 500:  # Server error
                raise  # Retry
            else:
                # Client error, don't retry
                return {"error": str(e)}
```

### Anti-Pattern 6: Monolithic Prompt Templates

**What:** Storing entire prompt as one large string with no variable substitution

**Why bad:** Cannot reuse prompt logic across test cases. Must duplicate prompt for minor variations (e.g., different festivals).

**Consequences:** Difficult to maintain, inconsistent prompts, hard to A/B test

**Instead:** Use template syntax with variables

```python
# BAD
test_case_1 = {"prompt": "Extract lineup from this Coachella image..."}
test_case_2 = {"prompt": "Extract lineup from this Lollapalooza image..."}
# Duplicated logic, hard to update

# GOOD
template = "Extract lineup from this {festival_name} image. Focus on {category} artists."
test_case_1 = {
    "prompt_template": template,
    "variables": {"festival_name": "Coachella", "category": "headliner"}
}
test_case_2 = {
    "prompt_template": template,
    "variables": {"festival_name": "Lollapalooza", "category": "all"}
}
```

## Scalability Considerations

| Concern | Current (MVP) | At 1K Tests | At 10K Tests | At 100K Tests |
|---------|---------------|-------------|--------------|---------------|
| **Storage** | JSON files (local filesystem) | Same (add indexing) | SQLite or PostgreSQL | PostgreSQL with partitioning |
| **Job Queue** | asyncio.Queue (in-memory) | Redis Queue | Redis Queue + multiple workers | Celery + RabbitMQ/Redis |
| **Image Storage** | Local filesystem (hash-based) | Same (add CDN caching) | Object storage (S3, R2) | S3 + CloudFront CDN |
| **API Rate Limits** | Simple semaphore + sleep | Token bucket algorithm | Distributed rate limiter (Redis) | Per-account quotas + queueing |
| **Result Aggregation** | In-memory (Pandas) | Same | Pre-compute summaries | Background aggregation jobs |
| **Frontend Data** | Fetch all results at once | Pagination (100/page) | Virtual scrolling + lazy load | Server-side filtering/search |
| **Monitoring** | Logs only | Structured logging + metrics | APM (Prometheus + Grafana) | Distributed tracing (OpenTelemetry) |

## Build Order (Suggested Dependency Chain)

### Phase 1: Foundation (Core Services)
**Goal:** Basic infrastructure without UI or batch execution

1. **Storage Service** - File-based persistence for test cases
   - Read/write JSON files
   - List all test cases
   - Atomic writes (temp file + rename)

2. **Image Service** - Upload and retrieve images
   - Content-addressed storage (SHA256 hash)
   - File type validation
   - Metadata extraction

3. **FastAPI Scaffold** - Basic API server with routes
   - Health check endpoint
   - CORS middleware for React
   - Pydantic models for test cases

**Why first:** Storage and image handling are dependencies for everything else. Getting file I/O correct early prevents rework.

**Deliverable:** Can POST/GET test cases via curl/Postman

### Phase 2: LLM Integration (Single Test Execution)
**Goal:** Execute one test case at a time via API

4. **LLM Client** - Claude API integration
   - Text-only completion
   - Image + text completion
   - Error handling and retries

5. **Single Test Executor** - Execute one test case
   - Load test case by ID
   - Substitute template variables
   - Call LLM client
   - Return raw result

6. **Evaluator Service** - Compare result to expected output
   - Exact string match
   - Case-insensitive match
   - Contains substring

**Why second:** Validates LLM integration works before adding complexity of batching and async processing.

**Deliverable:** Can trigger test execution and see pass/fail result

### Phase 3: Batch Execution (Async Processing)
**Goal:** Run multiple tests in parallel with progress tracking

7. **Job Queue** - Async task queue
   - In-memory asyncio.Queue
   - Job status tracking (pending/running/completed)
   - Concurrency limits

8. **Batch Processor** - Parallel test execution
   - Rate limiting (requests per minute)
   - Progress tracking
   - Partial failure handling

9. **WebSocket Manager** - Real-time progress updates
   - Job subscription
   - Event broadcasting
   - Frontend connection management

**Why third:** Batch execution is complex (async, concurrency, error handling). Build after single-test execution works.

**Deliverable:** Can queue multiple tests and see real-time progress

### Phase 4: Frontend (User Interface)
**Goal:** Web UI for managing tests and viewing results

10. **React Scaffold** - Basic React app with routing
    - Vite + TypeScript
    - React Router
    - API client setup

11. **Test Case Manager** - CRUD UI for test cases
    - List all test cases
    - Create/edit test case form
    - Upload images (drag-drop)

12. **Execution Controller** - Trigger batch runs
    - Select tests to run
    - Start execution button
    - Real-time progress bar (WebSocket)

13. **Results Dashboard** - View evaluation results
    - Table of results (pass/fail)
    - Filter by status
    - Export to CSV

**Why fourth:** Backend API must be stable before building UI. Frontend can be developed quickly once API is ready.

**Deliverable:** Complete UI for test management and execution

### Phase 5: Analysis & Comparison (Advanced Features)
**Goal:** Compare strategies and analyze performance

14. **Result Aggregator** - Calculate summary statistics
    - Pass rate per strategy
    - Average completion time
    - Token usage tracking

15. **Strategy Comparator** - A/B testing UI
    - Side-by-side comparison table
    - Diff highlighting
    - Statistical significance

16. **Export/Import** - Data portability
    - Export results to CSV/JSON
    - Import test cases from CSV
    - Backup/restore functionality

**Why fifth:** Advanced features depend on having real data from batch executions. Build after MVP is usable.

**Deliverable:** Can compare prompting strategies and make data-driven decisions

## Technology Recommendations

### Backend Stack
- **FastAPI 0.115+** - Async Python web framework
- **Pydantic 2.x** - Data validation and serialization
- **httpx** - Async HTTP client for Claude API
- **tenacity** - Retry logic with exponential backoff
- **aiofiles** - Async file I/O
- **python-multipart** - File upload handling
- **uvicorn** - ASGI server (production: uvicorn + gunicorn)

### Frontend Stack
- **React 18+** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **TanStack Query (React Query)** - Server state management
- **WebSocket API** - Real-time updates (native browser API)
- **Tailwind CSS** - Styling (optional but recommended for rapid UI)

### Development Tools
- **pytest + pytest-asyncio** - Backend testing
- **Vitest** - Frontend testing
- **Docker Compose** - Local development environment
- **OpenAPI/Swagger** - Auto-generated API docs (built into FastAPI)

## Sources

### LLM Evaluation Architecture
- [Top 5 Prompt Testing & Optimization Tools in 2026](https://www.getmaxim.ai/articles/top-5-prompt-testing-optimization-tools-in-2026/)
- [The best LLM evaluation tools of 2026](https://medium.com/online-inference/the-best-llm-evaluation-tools-of-2026-40fd9b654dce)
- [GitHub - promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)
- [Best LLM Evaluation Tools: Top 9 Frameworks for Testing AI Models](https://www.zenml.io/blog/best-llm-evaluation-tools)
- [GitHub - confident-ai/deepeval](https://github.com/confident-ai/deepeval)

### LLM System Design Patterns
- [The Architect's Guide to LLM System Design: From Prompt to Production](https://medium.com/@vi.ha.engr/the-architects-guide-to-llm-system-design-from-prompt-to-production-8be21ebac8bc)
- [Design Patterns for Long-Term Memory in LLM-Powered Architectures](https://serokell.io/blog/design-patterns-for-long-term-memory-in-llm-powered-architectures)

### FastAPI + LLM Architecture
- [FastAPI vs Django vs Flask in 2026: Choosing the Right Python Web Framework](https://developersvoice.com/blog/python/fastapi_django_flask_architecture_guide/)
- [FastAPI for LLM Systems: Production LangChain Template](https://activewizards.com/blog/fastapi-for-llm-systems-production-langchain-template)
- [Serving an LLM application as an API endpoint using FastAPI in Python](https://www.datacamp.com/tutorial/serving-an-llm-application-as-an-api-endpoint-using-fastapi-in-python)

### Batch Processing & Job Queues
- [Scaling LLM Workloads with OpenAI's Batch API](https://medium.com/next-token/scaling-llm-workloads-with-openais-batch-api-a-guide-for-data-and-ai-engineers-7c706713c02d)
- [Efficient Request Queueing – Optimizing LLM Performance](https://huggingface.co/blog/tngtech/llm-performance-request-queueing)
- [Building an Async Prompt Queue for High-Volume LLM Serving](https://dev.co/ai/async-prompt-queue-for-llms)

### FastAPI + React Full Stack
- [GitHub - fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template)
- [FARM Stack Guide: How to Build Full-Stack Apps with FastAPI, React & MongoDB](https://www.datacamp.com/tutorial/farm-stack-guide)
- [Full-Stack Development with FastAPI and React: A CRUD Operations Walkthrough](https://medium.com/@suganthi2496/full-stack-development-with-fastapi-and-react-a-crud-operations-walkthrough-beb2a9c660ed)

### Multimodal LLM Evaluation
- [Multimodal LLM Evaluation: Overcoming Challenges](https://galileo.ai/blog/multimodal-llm-guide-evaluation)
- [Large Multimodal Models (LMMs) vs LLMs in 2026](https://research.aimultiple.com/large-multimodal-models/)

### Evaluation Metrics & Testing
- [The LLM Evaluation Landscape with Frameworks in 2026](https://research.aimultiple.com/llm-eval-tools/)
- [Prompt Evaluation - Methods, Tools, And Best Practices](https://mirascope.com/blog/prompt-evaluation)
- [LLM evaluation metrics: Full guide to LLM evals and key metrics](https://www.braintrust.dev/articles/llm-evaluation-metrics-guide)

### Prompt Flow & Testing Frameworks
- [Prompt flow in Microsoft Foundry portal](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic)
- [ChainForge: A Visual Toolkit for Prompt Engineering and LLM Hypothesis Testing](https://arxiv.org/html/2309.09128v3)
- [6 Top Prompt Testing Frameworks in 2025](https://mirascope.com/blog/prompt-testing-framework)

### Test Management Architecture
- [Best Test Management Tools 2026: Top 5 Platforms Compared](https://www.techtimes.com/articles/314019/20260113/5-best-test-management-tools-software-teams-2026.htm)
- [12 best test management tools in 2026](https://qase.io/blog/best-test-management-tools/)
