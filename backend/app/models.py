from typing import Literal, Optional

from pydantic import BaseModel


class Activity(BaseModel):
    id: Optional[str] = None
    component: str
    subComponent: str
    agency: str
    agencies: list[str]
    subAgency: Optional[str] = None
    title: str
    estimatedValue: Optional[float] = None
    estimatedValueRaw: str = ""
    targetTiming: str = ""
    targetDate: Optional[str] = None
    timelineStatus: Literal[
        "Overdue",
        "Immediate",
        "Due Soon",
        "On Track",
        "To Be Confirmed",
    ]
    completionStatus: Literal["Not Started", "In Progress", "Completed", "Delayed"]
    pmcResourceAligned: Optional[str] = None
    remarks: Optional[str] = None
