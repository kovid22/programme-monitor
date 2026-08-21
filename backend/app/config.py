import json
from typing import Any, Dict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_SHEET_ID: str = ""
    GOOGLE_SHEET_RANGE: str = "Sheet1!A:Z"
    GOOGLE_SERVICE_ACCOUNT_JSON: str = ""
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    @property
    def service_account_info(self) -> Dict[str, Any]:
        if not self.GOOGLE_SERVICE_ACCOUNT_JSON:
            return {}
        try:
            return json.loads(self.GOOGLE_SERVICE_ACCOUNT_JSON)
        except json.JSONDecodeError:
            return {}

    class Config:
        env_file = ".env"

settings = Settings()
