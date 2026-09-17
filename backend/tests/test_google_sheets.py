import pytest
from unittest.mock import MagicMock, patch

from app.config import settings
from app.services.google_sheets import (
    _fetch_from_google_sheets,
    ProgrammeDataSourceError,
    ProgrammeDataConfigurationError,
)

def _mock_sheets_service(responses: dict) -> MagicMock:
    service = MagicMock()

    def side_effect(spreadsheetId, range):
        mock_req = MagicMock()
        mock_req.execute.return_value = {"values": responses.get(spreadsheetId, [])}
        return mock_req

    service.spreadsheets.return_value.values.return_value.get.side_effect = side_effect
    return service

def _setup_env(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_SHEET_DOE_ID", "doe_id")
    monkeypatch.setattr(settings, "GOOGLE_SHEET_PWD_ID", "pwd_id")
    monkeypatch.setattr(settings, "GOOGLE_SHEET_JSV_ID", "jsv_id")
    monkeypatch.setattr(settings, "GOOGLE_SHEET_SRLM_ID", "srlm_id")

# Required common headers
H_COMMON = [
    "No.", "Component", "Sub-Component", "Action / Activity",
    "Target / Timing", "Timeline Status", "PMC Resource Aligned",
    "Completion Status", "Remarks"
]
# Headers with DoE sub agency
H_DOE = H_COMMON + ["Sub Agency"]

def _row(no="1", component="Comp", sub_comp="Sub", action="Act", target="15/08/2026", t_status="On Track", pmc="Yes", c_status="In Progress", remarks="Rem", sub_agency=None):
    base = [no, component, sub_comp, action, target, t_status, pmc, c_status, remarks]
    if sub_agency is not None:
        base.append(sub_agency)
    return base

def test_aggregates_rows_from_all_four_sources(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_DOE, _row(no="1", sub_agency="SA")],
        "pwd_id": [H_COMMON, _row(no="2")],
        "jsv_id": [H_COMMON, _row(no="3")],
        "srlm_id": [H_COMMON, _row(no="4")]
    }

    service = _mock_sheets_service(responses)
    with patch("app.services.google_sheets.get_sheets_service", return_value=service):
        activities = _fetch_from_google_sheets()

    assert len(activities) == 4
    agencies = {a.sourceAgency for a in activities}
    assert agencies == {"DoE", "PWD", "JSV", "SRLM"}

def test_source_agency_is_correct_and_matches_agency(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_DOE, _row(no="1", sub_agency="SA")],
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }

    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()

    assert len(activities) == 1
    assert activities[0].sourceAgency == "DoE"
    assert activities[0].agency == "DoE"
    assert activities[0].agencies == ["DoE"]

def test_uid_is_unique_when_multiple_sheets_contain_same_no(monkeypatch):
    _setup_env(monkeypatch)
    # Both DoE and PWD have row with No. = 1
    responses = {
        "doe_id": [H_DOE, _row(no="1", sub_agency="")],
        "pwd_id": [H_COMMON, _row(no="1")],
        "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()

    assert len(activities) == 2
    uids = {a.uid for a in activities}
    assert uids == {"DoE:1", "PWD:1"}

def test_blank_no_receives_deterministic_fallback_uid(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_COMMON, _row(no="")], # row 2 in data
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()

    assert len(activities) == 1
    assert activities[0].uid == "DoE:row-2"

def test_doe_sub_agency_is_parsed_and_others_are_none(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_DOE, _row(no="1", sub_agency="Urban")],
        "pwd_id": [H_COMMON, _row(no="2")],
        "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()

    doe_act = next(a for a in activities if a.sourceAgency == "DoE")
    pwd_act = next(a for a in activities if a.sourceAgency == "PWD")

    assert doe_act.subAgency == "Urban"
    assert pwd_act.subAgency is None

def test_headers_may_be_in_different_column_positions(monkeypatch):
    _setup_env(monkeypatch)
    shuffled_h = ["Action / Activity", "No.", "Component", "Target / Timing", "Timeline Status", "Completion Status", "Sub-Component", "Remarks", "PMC Resource Aligned"]
    shuffled_r = ["Act", "1", "Comp", "15/08/2026", "On Track", "In Progress", "Sub", "Rem", "Yes"]

    responses = {
        "doe_id": [shuffled_h, shuffled_r],
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()

    assert len(activities) == 1
    assert activities[0].component == "Comp"
    assert activities[0].title == "Act"

def test_missing_required_header_causes_configuration_failure(monkeypatch):
    _setup_env(monkeypatch)
    bad_h = ["No.", "Component"] # Missing other required
    responses = {
        "doe_id": [bad_h, ["1", "Comp"]],
        "pwd_id": [H_COMMON, _row()], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        with pytest.raises(ProgrammeDataConfigurationError):
            _fetch_from_google_sheets()

def test_completely_empty_source_raises_configuration_error(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_DOE, _row()],
        "pwd_id": [H_COMMON, _row()],
        "jsv_id": [H_COMMON, _row()],
        "srlm_id": [] # Completely empty source
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        with pytest.raises(ProgrammeDataConfigurationError, match="Source SRLM is completely empty \\(missing header row\\)"):
            _fetch_from_google_sheets()

def test_a_failure_in_one_source_fails_the_entire_refresh(monkeypatch):
    _setup_env(monkeypatch)
    service = MagicMock()
    service.spreadsheets.return_value.values.return_value.get.side_effect = Exception("API error")
    with patch("app.services.google_sheets.get_sheets_service", return_value=service):
        with pytest.raises(Exception):
            _fetch_from_google_sheets()

def test_valid_empty_source_is_allowed(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_DOE], # Headers only
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()
    assert len(activities) == 0

def test_target_date_parses_for_actual_dates(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_COMMON, _row(target="15/08/2026")],
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()
    assert activities[0].targetDate == "2026-08-15"
    assert activities[0].targetTiming == "15/08/2026"

def test_immediate_within_3_months_remain_target_timing_with_date_none(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_COMMON, _row(target="Immediate")],
        "pwd_id": [H_COMMON, _row(no="2", target="Within 3 months")],
        "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()
    assert activities[0].targetDate is None
    assert activities[0].targetTiming == "Immediate"
    assert activities[1].targetDate is None
    assert activities[1].targetTiming == "Within 3 months"

def test_existing_timeline_completion_validation_remains_intact(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_COMMON, _row(t_status="Fake Status", c_status="Fake")],
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()
    # Invalid rows skipped
    assert len(activities) == 0

def test_estimated_value_remains_none_and_raw_remains_empty(monkeypatch):
    _setup_env(monkeypatch)
    responses = {
        "doe_id": [H_COMMON, _row()],
        "pwd_id": [H_COMMON], "jsv_id": [H_COMMON], "srlm_id": [H_COMMON]
    }
    with patch("app.services.google_sheets.get_sheets_service", return_value=_mock_sheets_service(responses)):
        activities = _fetch_from_google_sheets()
    assert activities[0].estimatedValue is None
    assert activities[0].estimatedValueRaw == ""
