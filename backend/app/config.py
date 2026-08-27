import json
from typing import Any

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_SHEET_ID: str = ""
    GOOGLE_SHEET_RANGE: str = "Sheet1!A:Z"
    GOOGLE_SERVICE_ACCOUNT_JSON: str = ""
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    # Firebase Admin
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""

    # Approved-user allowlist (comma-separated emails)
    ALLOWED_EMAILS: str = ""

    @property
    def service_account_info(self) -> dict[str, Any]:
        """Return Google credentials or fail closed on invalid configuration."""
        if not self.GOOGLE_SERVICE_ACCOUNT_JSON:
            return {}
        try:
            service_account_info = json.loads(self.GOOGLE_SERVICE_ACCOUNT_JSON)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "GOOGLE_SERVICE_ACCOUNT_JSON must contain valid JSON."
            ) from exc
        if not isinstance(service_account_info, dict):
            raise ValueError(
                "GOOGLE_SERVICE_ACCOUNT_JSON must contain a JSON object."
            )
        return service_account_info

    @property
    def firebase_service_account_info(self) -> dict[str, Any]:
        """Return Firebase credentials or fail closed on invalid configuration."""
        if not self.FIREBASE_SERVICE_ACCOUNT_JSON:
            return {}
        try:
            service_account_info = json.loads(self.FIREBASE_SERVICE_ACCOUNT_JSON)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON."
            ) from exc
        if not isinstance(service_account_info, dict):
            raise ValueError(
                "FIREBASE_SERVICE_ACCOUNT_JSON must contain a JSON object."
            )
        return service_account_info

    @property
    def allowed_emails_set(self) -> set[str]:
        """Return normalized, non-empty email addresses from the allowlist."""
        return {
            email.strip().lower()
            for email in self.ALLOWED_EMAILS.split(",")
            if email.strip()
        }

    @property
    def is_production(self) -> bool:
        """Return whether production-only application settings should apply."""
        return self.ENVIRONMENT.strip().lower() == "production"

    class Config:
        env_file = ".env"

settings = Settings()
