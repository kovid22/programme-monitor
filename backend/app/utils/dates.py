from datetime import datetime, date
from typing import Optional

def parse_target_date(date_str: str) -> Optional[str]:
    """
    Parses a raw spreadsheet date string.
    Normalizes 'real dates' to 'YYYY-MM-DD'.
    Normalizes blank, 'TBC', 'Immediate', 'This Week' to None.
    """
    if not date_str:
        return None
        
    s = str(date_str).strip()
    s_upper = s.upper()
    if not s or s_upper == "TBC" or s_upper == "IMMEDIATE" or s_upper == "THIS WEEK":
        return None
        
    # Attempt to parse common date formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            d = datetime.strptime(s, fmt).date()
            return d.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    # Unparseable target
    return None


def determine_timeline_status(target_date_str: Optional[str], raw_date_str: str, current_date: Optional[date] = None) -> str:
    """
    Derives Timeline Status from Target Date according to business rules.
    - explicit source value Immediate -> Immediate
    - explicit source value This Week -> Immediate
    - blank / TBC / unparseable -> TBC
    - < today -> Overdue
    - today through 14 days -> Immediate
    - 15 through 44 days -> Due Soon
    - 45+ days -> On Track
    """
    if current_date is None:
        current_date = date.today()
        
    raw = str(raw_date_str).strip().upper() if raw_date_str else ""
    if raw in ("IMMEDIATE", "THIS WEEK"):
        return "Immediate"
        
    if not target_date_str:
        return "TBC"
        
    try:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except ValueError:
        return "TBC"
        
    delta = (target_date - current_date).days
    
    if delta < 0:
        return "Overdue"
    elif 0 <= delta <= 14:
        return "Immediate"
    elif 15 <= delta <= 44:
        return "Due Soon"
    else:
        return "On Track"
