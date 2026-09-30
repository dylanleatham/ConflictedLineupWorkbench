from backend.services.evaluator import calculate_accuracy


def test_perfect_match_is_case_and_whitespace_insensitive():
    result = calculate_accuracy(["  deadmau5", "SUBTRONICS"], ["deadmau5", "Subtronics"])
    assert result["accuracy_percentage"] == 100.0
    assert result["missed"] == [] and result["extra"] == []


def test_partial_match_reports_missed_and_extra():
    result = calculate_accuracy(["A", "B", "Z"], ["A", "B", "C", "D"])
    assert result["matched"] == 2
    assert result["accuracy_percentage"] == 50.0
    assert sorted(result["missed"]) == ["C", "D"]
    assert result["extra"] == ["Z"]


def test_matched_artists_keep_ground_truth_casing():
    result = calculate_accuracy(["rezz"], ["REZZ"])
    assert result["matched_artists"] == ["REZZ"]


def test_empty_ground_truth():
    result = calculate_accuracy(["A"], [])
    assert result["accuracy_percentage"] == 0.0
    assert result["extra"] == ["A"]


def test_empty_extraction():
    result = calculate_accuracy([], ["A", "B"])
    assert result["accuracy_percentage"] == 0.0
    assert result["missed"] == ["A", "B"]
