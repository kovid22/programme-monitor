import logging
from fastapi import FastAPI, HTTPException, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any, Dict

from app.config import settings
from app.models import Activity
from app.services.google_sheets import fetch_activities_with_timestamp
from app.services.google_sheets import ProgrammeDataSourceError
from app.auth import require_approved_user
from app.rate_limit import ActivitiesRateLimiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
activities_rate_limiter = ActivitiesRateLimiter()


class HealthResponse(BaseModel):
    status: str

class ActivitiesResponse(BaseModel):
    activities: List[Activity]
    count: int

def health_check():
    return {"status": "ok"}

def get_activities(
    response: Response,
    force_refresh: bool = False,
    _user: Dict[str, Any] = Depends(require_approved_user),
):
    email = _user["email"].strip().lower()
    rate_limit_result = activities_rate_limiter.check(email, force_refresh)
    if rate_limit_result:
        raise HTTPException(
            status_code=429,
            detail=rate_limit_result.detail,
            headers={"Retry-After": str(rate_limit_result.retry_after)},
        )

    try:
        activities, refreshed_at = fetch_activities_with_timestamp(force_refresh=force_refresh)
        if refreshed_at:
            response.headers["X-Data-Refreshed-At"] = refreshed_at
        return {"activities": activities, "count": len(activities)}
    except ProgrammeDataSourceError:
        logger.error("Programme data source is unavailable.")
        raise HTTPException(
            status_code=503,
            detail="Programme data is temporarily unavailable.",
        )
    except ValueError:
        logger.error("Programme data configuration or validation failed.")
        raise HTTPException(status_code=500, detail="Unable to load programme data.")
    except Exception:
        logger.error("Unexpected error while loading programme data.")
        raise HTTPException(status_code=500, detail="Internal server error.")


def create_app() -> FastAPI:
    """Create the API application with environment-appropriate documentation."""
    is_production = settings.is_production
    application = FastAPI(
        title="Programme Monitor API",
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_ORIGIN],
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Authorization"],
        expose_headers=["X-Data-Refreshed-At", "Retry-After"],
    )
    application.get("/api/health", response_model=HealthResponse)(health_check)
    application.get("/api/activities", response_model=ActivitiesResponse)(get_activities)
    return application


app = create_app()
