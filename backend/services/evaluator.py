"""Accuracy evaluation service for lineup extraction."""

from typing import List, Dict, Any


def calculate_accuracy(extracted: List[str], ground_truth: List[str]) -> Dict[str, Any]:
    """
    Calculate accuracy by comparing extracted artists against ground truth.

    Uses case-insensitive string matching with set operations for efficiency.

    Args:
        extracted: List of artist names extracted by Claude
        ground_truth: List of known correct artist names

    Returns:
        Dictionary with accuracy breakdown:
        - total_ground_truth: count of ground truth artists
        - total_extracted: count of extracted artists
        - matched: count of matches
        - accuracy_percentage: float (0-100), rounded to 2 decimals
        - missed: list of artists in ground truth but not extracted (original casing)
        - extra: list of artists extracted but not in ground truth
        - matched_artists: list of matched artists (original casing from ground truth)
    """
    # Handle edge cases
    if not ground_truth:
        return {
            "total_ground_truth": 0,
            "total_extracted": len(extracted),
            "matched": 0,
            "accuracy_percentage": 0.0,
            "missed": [],
            "extra": list(extracted),
            "matched_artists": []
        }

    if not extracted:
        return {
            "total_ground_truth": len(ground_truth),
            "total_extracted": 0,
            "matched": 0,
            "accuracy_percentage": 0.0,
            "missed": list(ground_truth),
            "extra": [],
            "matched_artists": []
        }

    # Normalize for comparison: strip whitespace, lowercase
    def normalize(s: str) -> str:
        return s.strip().lower()

    # Build lookup maps: normalized -> original casing
    ground_truth_normalized = {normalize(artist): artist for artist in ground_truth}
    extracted_normalized = {normalize(artist): artist for artist in extracted}

    # Use set operations for matching
    gt_set = set(ground_truth_normalized.keys())
    ex_set = set(extracted_normalized.keys())

    matched_normalized = gt_set & ex_set
    missed_normalized = gt_set - ex_set
    extra_normalized = ex_set - gt_set

    # Convert back to original casing
    matched_artists = [ground_truth_normalized[n] for n in matched_normalized]
    missed = [ground_truth_normalized[n] for n in missed_normalized]
    extra = [extracted_normalized[n] for n in extra_normalized]

    # Calculate percentage
    matched_count = len(matched_normalized)
    total_gt = len(ground_truth)
    accuracy_percentage = round((matched_count / total_gt) * 100, 2)

    return {
        "total_ground_truth": total_gt,
        "total_extracted": len(extracted),
        "matched": matched_count,
        "accuracy_percentage": accuracy_percentage,
        "missed": missed,
        "extra": extra,
        "matched_artists": matched_artists
    }
