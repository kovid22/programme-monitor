import logging
from typing import List, Optional

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.models import Activity
from app.utils.dates import parse_target_date, determine_timeline_status

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def get_sheets_service():
    info = settings.service_account_info
    if not info:
        raise ValueError("Google Service Account configuration is missing or invalid.")
    
    try:
        creds = Credentials.from_service_account_info(info, scopes=SCOPES)
        service = build('sheets', 'v4', credentials=creds)
        return service
    except Exception as e:
        logger.error(f"Failed to build credentials: {e}")
        raise ValueError("Invalid Google Service Account credentials.")

def parse_estimated_value(val: str) -> Optional[float]:
    if not val:
        return None
    val = str(val).strip().replace(',', '')
    try:
        return float(val)
    except ValueError:
        return None

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

def fetch_activities() -> List[Activity]:
    if not settings.GOOGLE_SHEET_ID:
        raise ValueError("GOOGLE_SHEET_ID is not configured.")
        
    try:
        service = get_sheets_service()
        sheet = service.spreadsheets()
        result = sheet.values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=settings.GOOGLE_SHEET_RANGE
        ).execute()
        
        values = result.get('values', [])
    except HttpError as e:
        logger.error(f"Google Sheets API Error: {e}")
        raise ValueError("Failed to fetch data from Google Sheets API.")
    except Exception as e:
        logger.error(f"Error fetching sheets: {e}")
        raise ValueError("Failed to initialize Google Sheets client.")
        
    if not values:
        return []
        
    headers = [str(h).strip().lower() for h in values[0]]
    
    def get_index(possible_names: List[str]) -> int:
        for name in possible_names:
            if name.lower() in headers:
                return headers.index(name.lower())
        return -1
        
    id_idx = get_index(['id', 'no.', 'no', 'number'])
    ws_idx = get_index(['workstream', 'component'])
    sub_ws_idx = get_index(['sub-workstream', 'sub workstream', 'sub-component', 'sub component'])
    agency_idx = get_index(['agency', 'agency / responsible', 'responsible'])
    activity_idx = get_index(['activity', 'action', 'action / activity'])
    est_val_idx = get_index(['estimated value', 'est. value inr lakh', 'est. value (inr lakh)', 'est value'])
    target_date_idx = get_index(['target date', 'target'])
    comp_status_idx = get_index(['completion status', 'status'])
    
    if ws_idx == -1 or activity_idx == -1:
        raise ValueError("Missing required headers: Workstream or Activity.")
        
    activities = []
    
    for i, row in enumerate(values[1:], start=2):
        if not any(str(cell).strip() for cell in row):
            continue
            
        def get_val(idx: int) -> str:
            if idx == -1 or idx >= len(row):
                return ""
            return str(row[idx]).strip()
            
        workstream = get_val(ws_idx)
        activity_title = get_val(activity_idx)
        
        if not workstream or not activity_title:
            logger.warning(f"Row {i} skipped: Missing workstream or activity title.")
            continue
            
        id_val = get_val(id_idx) if id_idx != -1 else None
        raw_target_date = get_val(target_date_idx)
        parsed_target_date = parse_target_date(raw_target_date)
        
        try:
            completion_status = normalize_completion_status(get_val(comp_status_idx))
        except ValueError as e:
            logger.warning(f"Row {i} skipped: {e}")
            continue
            
        timeline_status = determine_timeline_status(parsed_target_date, raw_target_date)
        est_val = parse_estimated_value(get_val(est_val_idx))
        
        activities.append(Activity(
            id=id_val if id_val else None,
            workstream=workstream,
            subWorkstream=get_val(sub_ws_idx),
            agency=get_val(agency_idx),
            title=activity_title,
            estimatedValue=est_val,
            targetDate=parsed_target_date,
            timelineStatus=timeline_status, # type: ignore
            completionStatus=completion_status # type: ignore
        ))
        
    return activities
