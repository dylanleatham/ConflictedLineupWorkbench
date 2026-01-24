"""FastAPI application for Festival Lineup Evaluator."""

from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")
from fastapi.middleware.cors import CORSMiddleware

from backend.api import test_cases, images, executions
from backend.storage import ensure_dirs


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

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(test_cases.router)
app.include_router(images.router)
app.include_router(executions.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Festival Lineup Evaluator API",
        "version": "1.0.0",
        "docs": "/docs"
    }
