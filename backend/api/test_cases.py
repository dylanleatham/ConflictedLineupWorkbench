"""REST API endpoints for test case management."""

import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.storage import (
    TestCase,
    save_test_case,
    load_test_case,
    load_all_test_cases,
    delete_test_case
)

router = APIRouter(prefix="/api/test-cases", tags=["test-cases"])


class CreateTestCaseRequest(BaseModel):
    """Request body for creating a test case."""
    name: str
    lineup: List[str]
    image_hash: Optional[str] = None


class UpdateTestCaseRequest(BaseModel):
    """Request body for updating a test case."""
    name: Optional[str] = None
    lineup: Optional[List[str]] = None
    image_hash: Optional[str] = None


def generate_id(name: str) -> str:
    """
    Generate a unique ID from a test case name.

    Slugifies the name and adds a timestamp to ensure uniqueness.

    Args:
        name: Test case name

    Returns:
        Unique ID (e.g., "coachella-2024-1234567890")
    """
    # Slugify: lowercase, replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug).strip('-')

    # Add timestamp for uniqueness
    timestamp = int(datetime.utcnow().timestamp())

    return f"{slug}-{timestamp}"


@router.post("", response_model=TestCase, status_code=status.HTTP_201_CREATED)
async def create_test_case(request: CreateTestCaseRequest) -> TestCase:
    """
    Create a new test case.

    Args:
        request: Test case creation request

    Returns:
        Created test case
    """
    # Generate unique ID
    test_id = generate_id(request.name)

    # Create test case
    test_case = TestCase(
        id=test_id,
        name=request.name,
        lineup=request.lineup,
        image_hash=request.image_hash
    )

    # Save to storage
    save_test_case(test_case)

    return test_case


@router.get("", response_model=List[TestCase])
async def list_test_cases() -> List[TestCase]:
    """
    List all test cases.

    Returns:
        List of all test cases
    """
    return load_all_test_cases()


@router.get("/{test_id}", response_model=TestCase)
async def get_test_case(test_id: str) -> TestCase:
    """
    Get a single test case by ID.

    Args:
        test_id: Test case ID

    Returns:
        Test case

    Raises:
        HTTPException: 404 if test case not found
    """
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test case '{test_id}' not found"
        )
    return test_case


@router.put("/{test_id}", response_model=TestCase)
async def update_test_case(test_id: str, request: UpdateTestCaseRequest) -> TestCase:
    """
    Update a test case.

    Args:
        test_id: Test case ID
        request: Update request with optional fields

    Returns:
        Updated test case

    Raises:
        HTTPException: 404 if test case not found
    """
    # Load existing test case
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test case '{test_id}' not found"
        )

    # Update fields if provided
    if request.name is not None:
        test_case.name = request.name
    if request.lineup is not None:
        test_case.lineup = request.lineup
    if request.image_hash is not None:
        test_case.image_hash = request.image_hash

    # Save updated test case
    save_test_case(test_case)

    return test_case


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_case_endpoint(test_id: str) -> None:
    """
    Delete a test case.

    Args:
        test_id: Test case ID

    Raises:
        HTTPException: 404 if test case not found
    """
    # Check if exists first
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test case '{test_id}' not found"
        )

    # Delete
    delete_test_case(test_id)
