import logging
from typing import List, Optional

from google.auth import default as default_credentials
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.models import Activity
from app.utils.dates import parse_target_date
from typing import Literal

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

TIMELINE_STATUSES = frozenset({
    "Overdue",
    "Due Soon",
    "On Track",
    "Immediate",
    "To Be Confirmed",
})

class ProgrammeDataSourceError(Exception):
    """Raised when Google Sheets cannot provide programme data."""

class ProgrammeDataConfigurationError(ValueError):
    """Raised when programme data configuration or schema is invalid."""

def get_sheets_service():
    info = settings.service_account_info

    try:
        creds = (
            Credentials.from_service_account_info(info, scopes=SCOPES)
            if info
            else default_credentials(scopes=SCOPES)[0]
        )
        service = build('sheets', 'v4', credentials=creds)
        return service
    except Exception as exc:
        logger.error("Failed to initialize Google Sheets credentials.")
        raise ProgrammeDataConfigurationError(
            "Unable to initialize Google Sheets credentials."
        ) from exc

def normalize_timeline_status(value: str) -> str:
    """Validate the sheet-owned Timeline Status value."""
    if value not in TIMELINE_STATUSES:
        raise ValueError("Invalid timeline status.")
    return value

def normalize_completion_status(val: str) -> str:
    if not val:
        return "Not Started"
    v = str(val).strip().lower()
    if v in ("not started",):
        return "Not Started"
    elif v in ("in progress",):
        return "In Progress"
    elif v in ("completed", "complete"):
        return "Completed"
    elif v in ("delayed",):
        return "Delayed"
    else:
        raise ValueError(f"Invalid completion status: {val}")

import threading
import time
from datetime import datetime, timezone, timedelta

class ActivityCache:
    def __init__(self, ttl: int = 180):
        self.ttl = ttl
        self.data: Optional[List[Activity]] = None
        self.timestamp: float = 0.0
        self.iso_timestamp: Optional[str] = None
        self.lock = threading.Lock()

_cache = ActivityCache(180)

def _fetch_from_google_sheets() -> List[Activity]:
    sources = [
        ("DoE", settings.GOOGLE_SHEET_DOE_ID, "'DOE'!A1:Z"),
        ("PWD", settings.GOOGLE_SHEET_PWD_ID, "'PWD'!A1:Z"),
        ("JSV", settings.GOOGLE_SHEET_JSV_ID, "'JSV'!A1:Z"),
        ("SRLM", settings.GOOGLE_SHEET_SRLM_ID, "'SRLM'!A1:Z"),
    ]

    for agency, sheet_id, _ in sources:
        if not sheet_id:
            raise ProgrammeDataConfigurationError(f"GOOGLE_SHEET_{agency.upper()}_ID is not configured.")

    try:
        service = get_sheets_service()
    except ProgrammeDataConfigurationError:
        raise
    except Exception as exc:
        logger.error("Google Sheets client request failed.")
        raise ProgrammeDataSourceError(
            "Failed to initialize Google Sheets client."
        ) from exc

    all_activities: List[Activity] = []

    for agency, sheet_id, range_name in sources:
        try:
            sheet = service.spreadsheets()
            result = sheet.values().get(
                spreadsheetId=sheet_id,
                range=range_name
            ).execute()
            values = result.get('values', [])
        except HttpError as exc:
            logger.error(f"Google Sheets API request failed for {agency}.")
            raise ProgrammeDataSourceError(
                f"Failed to fetch data from Google Sheets API for {agency}."
            ) from exc

        if not values:
            raise ProgrammeDataConfigurationError(f"Source {agency} is completely empty (missing header row).")

        headers = [str(header).strip().lower() for header in values[0]]

        required = [
            "no.",
            "component",
            "sub-component",
            "action / activity",
            "target / timing",
            "timeline status",
            "pmc resource aligned",
            "completion status",
            "remarks"
        ]

        header_indices = {}
        for req in required:
            if req not in headers:
                raise ProgrammeDataConfigurationError(f"Missing required header: {req} in source {agency}")
            header_indices[req] = headers.index(req)

        sub_agency_idx = headers.index("sub agency") if "sub agency" in headers else None

        for row_num, row in enumerate(values[1:], start=2):
            if not any(str(cell).strip() for cell in row):
                continue

            def get_val(key: str) -> str:
                idx = header_indices[key]
                if idx >= len(row):
                    return ""
                return str(row[idx]).strip()

            component = get_val("component")
            activity_title = get_val("action / activity")

            if not component or not activity_title:
                logger.warning(f"Skipping row {row_num} in {agency} with required fields missing.")
                continue

            id_val = get_val("no.")
            uid = f"{agency}:{id_val}" if id_val else f"{agency}:row-{row_num}"

            target_timing = get_val("target / timing")
            parsed_target_date = parse_target_date(target_timing)

            try:
                completion_status = normalize_completion_status(get_val("completion status"))
            except ValueError:
                logger.warning(f"Skipping row {row_num} in {agency} with invalid completion status.")
                continue

            try:
                timeline_status = normalize_timeline_status(get_val("timeline status"))
            except ValueError:
                logger.warning(f"Skipping row {row_num} in {agency} with invalid timeline status.")
                continue

            if sub_agency_idx is not None and sub_agency_idx < len(row):
                sub_agency = str(row[sub_agency_idx]).strip() or None
            else:
                sub_agency = None

            all_activities.append(Activity(
                uid=uid,
                sourceAgency=agency,  # type: ignore[arg-type]
                id=id_val if id_val else None,
                component=component,
                subComponent=get_val("sub-component"),
                agency=agency,
                agencies=[agency],
                subAgency=sub_agency,
                title=activity_title,
                estimatedValue=None,
                estimatedValueRaw="",
                targetTiming=target_timing,
                targetDate=parsed_target_date,
                timelineStatus=timeline_status,  # type: ignore[arg-type]
                completionStatus=completion_status,  # type: ignore[arg-type]
                pmcResourceAligned=get_val("pmc resource aligned") or None,
                remarks=get_val("remarks") or None,
            ))

    return all_activities

def fetch_activities_with_timestamp(force_refresh: bool = False) -> tuple[List[Activity], Optional[str]]:
    if not force_refresh:
        # Fast path lock-free read
        with _cache.lock:
            if _cache.data is not None and (time.time() - _cache.timestamp) < _cache.ttl:
                return _cache.data, _cache.iso_timestamp
                
    with _cache.lock:
        # Double check in case another thread just populated it
        if not force_refresh:
            if _cache.data is not None and (time.time() - _cache.timestamp) < _cache.ttl:
                return _cache.data, _cache.iso_timestamp
                
        # Fetch fresh
        try:
            fresh_data = _fetch_from_google_sheets()
            _cache.data = fresh_data
            _cache.timestamp = time.time()
            _cache.iso_timestamp = datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat()
            return fresh_data, _cache.iso_timestamp
        except Exception:
            if force_refresh and _cache.data is not None:
                # If force refresh fails but we have stale data, we raise the exception
                # to let the caller handle it, but we preserve the existing _cache.data
                pass
            raise

def fetch_activities(force_refresh: bool = False) -> List[Activity]:
    return fetch_activities_with_timestamp(force_refresh)[0]

