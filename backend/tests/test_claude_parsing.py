import pytest

from backend.services.claude import parse_claude_json_response, parse_claude_poster_response


@pytest.mark.parametrize("text", [
    '["Artist A", "Artist B"]',
    '```json\n["Artist A", "Artist B"]\n```',
    'Here is the lineup:\n["Artist A", "Artist B"]\nLet me know!',
    '{"festival": "Fest 2026", "source": "web", "artists": ["Artist A", "Artist B"]}',
    '```json\n{"festival": "Fest 2026", "artists": ["Artist A", "Artist B"]}\n```',
])
def test_parse_lineup_formats(text):
    assert parse_claude_json_response(text) == ["Artist A", "Artist B"]


def test_parse_lineup_coerces_to_strings():
    assert parse_claude_json_response("[1, 2]") == ["1", "2"]


def test_parse_lineup_rejects_prose():
    with pytest.raises(ValueError):
        parse_claude_json_response("I could not find a lineup for that festival.")


@pytest.mark.parametrize("text", [
    '{"poster_url": "https://x.test/p.jpg", "source_url": "https://x.test"}',
    'Found it!\n```json\n{"poster_url": "https://x.test/p.jpg"}\n```',
    'Result: {"poster_url": "https://x.test/p.jpg", "meta": {"w": 1}} done',
])
def test_parse_poster_formats(text):
    assert parse_claude_poster_response(text)["poster_url"] == "https://x.test/p.jpg"


def test_parse_poster_requires_poster_url():
    with pytest.raises(ValueError):
        parse_claude_poster_response('{"source_url": "https://x.test"}')
