"""Backend services for Festival Lineup Evaluator."""

from .evaluator import calculate_accuracy
from .claude import extract_lineup_from_text, extract_lineup_from_image, extract_poster_url
from .image_similarity import download_image, compute_image_similarity

__all__ = [
    "calculate_accuracy",
    "extract_lineup_from_text",
    "extract_lineup_from_image",
    "extract_poster_url",
    "download_image",
    "compute_image_similarity",
]
