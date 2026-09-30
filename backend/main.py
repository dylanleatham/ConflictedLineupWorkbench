"""FastAPI application for Festival Lineup Evaluator."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from project root before anything reads the environment
load_dotenv(Path(__file__).parent.parent / ".env")

from backend.api import (  # noqa: E402
    executions,
    images,
    poster_search_executions,
    prompts,
    test_cases,
    web_search_executions,
)
from backend.storage import ensure_dirs  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup: ensure storage directories exist
    ensure_dirs()
    yield
    # Shutdown: cleanup if needed


# Create FastAPI application
app = FastAPI(
    title="Festival Lineup Evaluator",
    description="API for managing festival test cases and extracting lineups from images",
    version="1.0.0",
    lifespan=lifespan
)

# The Vite dev server proxies /api, so CORS only matters when calling the API
# directly from another origin. Override with a comma-separated CORS_ORIGINS.
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(test_cases.router)
app.include_router(images.router)
app.include_router(executions.router)
app.include_router(prompts.router)
app.include_router(web_search_executions.router)
app.include_router(poster_search_executions.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Festival Lineup Evaluator API",
        "version": "1.0.0",
        "docs": "/docs"
    }
