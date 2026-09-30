import pytest
from PIL import Image

from backend.storage import (
    TestCase,
    delete_test_case,
    get_image_path,
    load_all_test_cases,
    load_result,
    load_test_case,
    save_image,
    save_result,
    save_test_case,
)
from backend.tests.conftest import make_png


def test_test_case_round_trip():
    save_test_case(TestCase(id="fest-1", name="Fest", lineup=["A", "B"]))
    loaded = load_test_case("fest-1")
    assert loaded is not None and loaded.lineup == ["A", "B"]
    assert [tc.id for tc in load_all_test_cases()] == ["fest-1"]
    assert delete_test_case("fest-1") is True
    assert load_test_case("fest-1") is None
    assert delete_test_case("fest-1") is False


@pytest.mark.parametrize("bad_id", ["../evil", "..\\evil", "a/b", "", "x" * 200])
def test_unsafe_ids_are_rejected(bad_id):
    assert load_test_case(bad_id) is None
    assert delete_test_case(bad_id) is False
    assert load_result(bad_id) is None
    assert get_image_path(bad_id) is None
    with pytest.raises(ValueError):
        save_result(bad_id, {})


def test_images_are_optimized_and_deduplicated():
    png = make_png(size=(2400, 1200))
    first, second = save_image(png), save_image(png)
    assert first == second
    with Image.open(get_image_path(first)) as img:
        assert img.format == "JPEG" and img.width == 1200


def test_results_are_separated_by_workspace():
    save_result("fest-1", {"status": "success"}, workspace="web-search")
    assert load_result("fest-1", workspace="web-search") == {"status": "success"}
    assert load_result("fest-1", workspace="image-eval") is None
