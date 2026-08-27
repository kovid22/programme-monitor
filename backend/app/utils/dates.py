from datetime import datetime
from typing import Optional

def parse_target_date(date_str: str) -> Optional[str]:
    """
    Parse a genuine spreadsheet date and normalize it to YYYY-MM-DD.

    Free-text timing instructions intentionally return None; they must never be
    converted into fabricated calendar dates.
    """
    if not date_str:
        return None
        
    s = str(date_str).strip()
    if not s:
        return None
        
    # Attempt to parse common date formats
    for fmt in (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%d-%b-%Y",
    ):
        try:
            d = datetime.strptime(s, fmt).date()
            return d.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    # Free-text timing instruction or unparseable target.
    return None
