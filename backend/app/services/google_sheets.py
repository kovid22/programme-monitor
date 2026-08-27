import logging
from typing import List, Optional

from google.auth import default as default_credentials
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.models import Activity
from app.utils.dates import parse_target_date

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

EXPECTED_HEADERS = [
    "no.",
    "component",
    "sub-component",
    "agency / responsible",
    "sub agency",
    "action / activity",
    "est. value (inr lakh)",
    "target / timing",
    "timeline status",
    "completion status",
    "pmc resource aligned",
    "remarks",
]

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

def parse_estimated_value(val: str) -> Optional[float]:
    if not val:
        return None
    val = str(val).strip().replace(',', '')
    try:
        return float(val)
    except ValueError:
        return None


def parse_agencies(value: str) -> list[str]:
    """Return unique, trimmed agency values while preserving display casing."""
    agencies: list[str] = []
    seen: set[str] = set()
    for agency in value.split(","):
        normalized = agency.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            agencies.append(normalized)
            seen.add(key)
    return agencies


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
    if not settings.GOOGLE_SHEET_ID:
        raise ProgrammeDataConfigurationError("GOOGLE_SHEET_ID is not configured.")
        
    try:
        service = get_sheets_service()
        sheet = service.spreadsheets()
        result = sheet.values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=settings.GOOGLE_SHEET_RANGE
        ).execute()
        
        values = result.get('values', [])
    except ProgrammeDataConfigurationError:
        raise
    except HttpError as exc:
        logger.error("Google Sheets API request failed.")
        raise ProgrammeDataSourceError(
            "Failed to fetch data from Google Sheets API."
        ) from exc
    except Exception as exc:
        logger.error("Google Sheets client request failed.")
        raise ProgrammeDataSourceError(
            "Failed to initialize Google Sheets client."
        ) from exc
        
    if not values:
        return []
        
    headers = [str(header).strip().lower() for header in values[0][:12]]
    if headers != EXPECTED_HEADERS:
        raise ProgrammeDataConfigurationError(
            "Programme data headers do not match the expected A:L schema."
        )

    activities: List[Activity] = []
    
    for row in values[1:]:
        if not any(str(cell).strip() for cell in row):
            continue
            
        def get_val(index: int) -> str:
            if index >= len(row):
                return ""
            return str(row[index]).strip()
            
        component = get_val(1)
        activity_title = get_val(5)
        
        if not component or not activity_title:
            logger.warning("Skipping programme row with required fields missing.")
            continue
            
        id_val = get_val(0)
        target_timing = get_val(7)
        parsed_target_date = parse_target_date(target_timing)
        
        try:
            completion_status = normalize_completion_status(get_val(9))
        except ValueError:
            logger.warning("Skipping programme row with invalid completion status.")
            continue
            
        try:
            timeline_status = normalize_timeline_status(get_val(8))
        except ValueError:
            logger.warning("Skipping programme row with invalid timeline status.")
            continue
        estimated_value_raw = get_val(6)
        
        activities.append(Activity(
            id=id_val if id_val else None,
            component=component,
            subComponent=get_val(2),
            agency=get_val(3),
            agencies=parse_agencies(get_val(3)),
            subAgency=get_val(4) or None,
            title=activity_title,
            estimatedValue=parse_estimated_value(estimated_value_raw),
            estimatedValueRaw=estimated_value_raw,
            targetTiming=target_timing,
            targetDate=parsed_target_date,
            timelineStatus=timeline_status,  # type: ignore[arg-type]
            completionStatus=completion_status,  # type: ignore[arg-type]
            pmcResourceAligned=get_val(10) or None,
            remarks=get_val(11) or None,
        ))
        
    return activities

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

