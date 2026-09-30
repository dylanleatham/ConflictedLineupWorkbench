from io import BytesIO

from PIL import Image, ImageDraw

from backend.services.image_similarity import compute_image_similarity
from backend.tests.conftest import make_png


def test_identical_images_score_100(tmp_path):
    png = make_png()
    path = tmp_path / "gt.png"
    path.write_bytes(png)
    assert compute_image_similarity(path, png)["similarity_percentage"] == 100.0


def test_resized_candidate_still_scores_high(tmp_path):
    path = tmp_path / "gt.png"
    path.write_bytes(make_png(size=(64, 96)))
    result = compute_image_similarity(path, make_png(size=(128, 192)))
    assert result["similarity_percentage"] > 95


def test_different_images_score_lower(tmp_path):
    gt = Image.new("RGB", (64, 64), "white")
    ImageDraw.Draw(gt).rectangle([0, 0, 31, 63], fill="black")
    path = tmp_path / "gt.png"
    gt.save(path)

    other = Image.new("RGB", (64, 64), "white")
    ImageDraw.Draw(other).rectangle([0, 0, 63, 31], fill="black")
    buf = BytesIO()
    other.save(buf, format="PNG")

    assert compute_image_similarity(path, buf.getvalue())["similarity_percentage"] < 50
