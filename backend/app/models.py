from typing import Optional, Literal
from pydantic import BaseModel

class Activity(BaseModel):
    id: Optional[str] = None
    workstream: str
    subWorkstream: str
    agency: str
    title: str
    estimatedValue: Optional[float] = None
    targetDate: Optional[str] = None
    timelineStatus: Literal["Overdue", "Immediate", "Due Soon", "On Track", "TBC"]
    completionStatus: Literal["Not Started", "In Progress", "Completed", "Delayed"]
