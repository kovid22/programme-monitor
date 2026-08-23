import logging
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from app.config import settings
from app.models import Activity
from app.services.google_sheets import fetch_activities_with_timestamp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Programme Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Data-Refreshed-At"],
)


class HealthResponse(BaseModel):
    status: str

class ActivitiesResponse(BaseModel):
    activities: List[Activity]
    count: int

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}

@app.get("/api/activities", response_model=ActivitiesResponse)
def get_activities(response: Response, force_refresh: bool = False):
    try:
        activities, refreshed_at = fetch_activities_with_timestamp(force_refresh=force_refresh)
        if refreshed_at:
            response.headers["X-Data-Refreshed-At"] = refreshed_at
        return {"activities": activities, "count": len(activities)}
    except ValueError as e:
        logger.error(f"Configuration or validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
