from app.utils.dates import parse_target_date

def test_parse_target_date():
    assert parse_target_date("2026-08-15") == "2026-08-15"
    assert parse_target_date("15/08/2026") == "2026-08-15"
    assert parse_target_date("Within 1 month") is None
    assert parse_target_date("Within 1 week of nominations") is None
    assert parse_target_date("Immediate") is None
    assert parse_target_date("") is None
    assert parse_target_date("  ") is None
