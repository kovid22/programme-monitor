from unittest.mock import MagicMock, patch

import pytest

from app.config import settings
from app.services.google_sheets import EXPECTED_HEADERS, _fetch_from_google_sheets


def _row(
    *,
    agency: str = "DoE",
    sub_agency: str = "",
    value: str = "1250.5",
    target_timing: str = "15/08/2026",
    timeline_status: str = "On Track",
    completion_status: str = "In Progress",
    pmc_resource_aligned: str = "Yes",
) -> list[str]:
    return [
        "1",
        "Component A",
        "Sub-Component A",
        agency,
        sub_agency,
        "Synthetic activity",
        value,
        target_timing,
        timeline_status,
        completion_status,
        pmc_resource_aligned,
        "Synthetic remark",
    ]


def _sheets_service(values: list[list[str]]) -> MagicMock:
    service = MagicMock()
    service.spreadsheets.return_value.values.return_value.get.return_value.execute.return_value = {
        "values": values
    }
    return service


def _fetch_values(monkeypatch, values: list[list[str]]):
    monkeypatch.setattr(settings, "GOOGLE_SHEET_ID", "synthetic-sheet")
    monkeypatch.setattr(settings, "GOOGLE_SHEET_RANGE", "A3:L")
    service = _sheets_service(values)
    with patch("app.services.google_sheets.get_sheets_service", return_value=service):
        activities = _fetch_from_google_sheets()
    return activities, service


def test_final_a_to_l_schema_maps_row_four_data(monkeypatch):
    activities, service = _fetch_values(monkeypatch, [EXPECTED_HEADERS, _row()])

    assert service.spreadsheets.return_value.values.return_value.get.call_args.kwargs[
        "range"
    ] == "A3:L"
    assert len(activities) == 1
    activity = activities[0]
    assert activity.component == "Component A"
    assert activity.subComponent == "Sub-Component A"
    assert activity.agencies == ["DoE"]
    assert activity.title == "Synthetic activity"
    assert activity.estimatedValue == 1250.5
    assert activity.estimatedValueRaw == "1250.5"
    assert activity.targetTiming == "15/08/2026"
    assert activity.targetDate == "2026-08-15"
    assert activity.subAgency is None
    assert activity.pmcResourceAligned == "Yes"
    assert activity.remarks == "Synthetic remark"


def test_agency_values_are_split_trimmed_and_deduplicated(monkeypatch):
    activities, _ = _fetch_values(
        monkeypatch,
        [EXPECTED_HEADERS, _row(agency="DoE, JSV, PWD, doe, , JSV")],
    )

    assert activities[0].agency == "DoE, JSV, PWD, doe, , JSV"
    assert activities[0].agencies == ["DoE", "JSV", "PWD"]


@pytest.mark.parametrize("value", ["", "TBD", "Not confirmed"])
def test_unknown_estimated_values_remain_non_numeric(monkeypatch, value):
    activities, _ = _fetch_values(monkeypatch, [EXPECTED_HEADERS, _row(value=value)])

    assert activities[0].estimatedValue is None
    assert activities[0].estimatedValueRaw == value


def test_free_text_target_timing_is_not_assigned_a_date(monkeypatch):
    activities, _ = _fetch_values(
        monkeypatch,
        [EXPECTED_HEADERS, _row(
            target_timing="Within 1 week of nominations",
            timeline_status="To Be Confirmed",
        )],
    )

    assert activities[0].targetTiming == "Within 1 week of nominations"
    assert activities[0].targetDate is None
    assert activities[0].timelineStatus == "To Be Confirmed"


def test_immediate_target_timing_is_preserved_and_prioritized(monkeypatch):
    activities, _ = _fetch_values(
        monkeypatch,
        [EXPECTED_HEADERS, _row(target_timing="Immediate", timeline_status="Immediate")],
    )

    assert activities[0].targetTiming == "Immediate"
    assert activities[0].targetDate is None
    assert activities[0].timelineStatus == "Immediate"


@pytest.mark.parametrize(
    "timeline_status",
    ["Overdue", "Due Soon", "On Track", "Immediate", "To Be Confirmed"],
)
def test_timeline_status_is_preserved_from_column_i(monkeypatch, timeline_status):
    activities, _ = _fetch_values(
        monkeypatch,
        [EXPECTED_HEADERS, _row(target_timing="Within 1 month", timeline_status=timeline_status)],
    )

    assert activities[0].timelineStatus == timeline_status


def test_invalid_timeline_status_is_not_exposed(monkeypatch):
    activities, _ = _fetch_values(
        monkeypatch,
        [EXPECTED_HEADERS, _row(timeline_status="Pending")],
    )

    assert activities == []


@pytest.mark.parametrize(
    "completion_status",
    ["Not Started", "In Progress", "Completed", "Delayed"],
)
def test_valid_completion_statuses_are_preserved(monkeypatch, completion_status):
    activities, _ = _fetch_values(
        monkeypatch,
        [EXPECTED_HEADERS, _row(completion_status=completion_status)],
    )

    assert activities[0].completionStatus == completion_status
