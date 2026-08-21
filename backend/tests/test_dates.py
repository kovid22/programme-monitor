from datetime import date
from app.utils.dates import parse_target_date, determine_timeline_status

def test_parse_target_date():
    assert parse_target_date("2026-08-15") == "2026-08-15"
    assert parse_target_date("15/08/2026") == "2026-08-15"
    assert parse_target_date("TBC") is None
    assert parse_target_date("tbc") is None
    assert parse_target_date("Immediate") is None
    assert parse_target_date("This Week") is None
    assert parse_target_date("") is None
    assert parse_target_date("  ") is None

def test_determine_timeline_status():
    today = date(2026, 8, 22)
    
    # explicit overrides
    assert determine_timeline_status(None, "Immediate", current_date=today) == "Immediate"
    assert determine_timeline_status(None, "This Week", current_date=today) == "Immediate"
    assert determine_timeline_status(None, "TBC", current_date=today) == "TBC"
    assert determine_timeline_status(None, "", current_date=today) == "TBC"
    
    # Overdue (yesterday)
    assert determine_timeline_status("2026-08-21", "2026-08-21", current_date=today) == "Overdue"
    
    # Immediate (today to 14 days)
    assert determine_timeline_status("2026-08-22", "2026-08-22", current_date=today) == "Immediate"
    assert determine_timeline_status("2026-09-05", "2026-09-05", current_date=today) == "Immediate"
    
    # Due Soon (15 to 44 days)
    assert determine_timeline_status("2026-09-06", "2026-09-06", current_date=today) == "Due Soon"
    assert determine_timeline_status("2026-10-05", "2026-10-05", current_date=today) == "Due Soon"
    
    # On Track (45+ days)
    assert determine_timeline_status("2026-10-06", "2026-10-06", current_date=today) == "On Track"
