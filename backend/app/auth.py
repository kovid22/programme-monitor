"""
Firebase Admin initialization and token-verification helpers.

Initialization is lazy: Firebase Admin is not initialized when this module
is imported, only when _get_firebase_app() is first called. This keeps
imports and tests that do not touch auth fast and credential-free.
"""

import logging
from typing import Any

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Firebase Admin initialization (lazy, idempotent)
# ---------------------------------------------------------------------------

def _get_firebase_app() -> firebase_admin.App:
    """
    Return the default Firebase Admin App, initializing it once if needed.

    Initialization strategy:
    - If FIREBASE_SERVICE_ACCOUNT_JSON is set, use credentials.Certificate.
    - Otherwise, fall back to Application Default Credentials (Cloud Run, etc.).

    Raises RuntimeError if initialization fails so callers can convert it
    to an appropriate HTTP 5xx, not a 401.
    """
    try:
        return firebase_admin.get_app()
    except ValueError:
        # App has not been initialized yet — initialize it now.
        pass
    except Exception as exc:
        logger.error("Firebase Admin initialization failed.")
        raise RuntimeError("Firebase Admin initialization failed") from exc

    try:
        service_account_info: dict[str, Any] = settings.firebase_service_account_info
        project_id = settings.FIREBASE_PROJECT_ID
        options = {"projectId": project_id} if project_id else {}
        credential = (
            credentials.Certificate(service_account_info)
            if service_account_info
            else credentials.ApplicationDefault()
        )
    except Exception as exc:
        logger.error("Firebase Admin initialization failed.")
        raise RuntimeError("Firebase Admin initialization failed") from exc

    try:
        return firebase_admin.initialize_app(credential, options)
    except ValueError as exc:
        # Another worker may have initialized the default app after our first check.
        try:
            return firebase_admin.get_app()
        except ValueError:
            logger.error("Firebase Admin initialization failed.")
            raise RuntimeError("Firebase Admin initialization failed") from exc
    except Exception as exc:
        logger.error("Firebase Admin initialization failed.")
        raise RuntimeError("Firebase Admin initialization failed") from exc


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def require_approved_user(
    http_creds: HTTPAuthorizationCredentials | None = Security(
        _bearer_scheme
    ),
) -> dict[str, Any]:
    """
    FastAPI dependency that:
      1. Extracts the Bearer token from the Authorization header.
      2. Verifies the token via Firebase Admin.
      3. Checks email_verified == True.
      4. Checks the normalized email is in ALLOWED_EMAILS.

    Returns the decoded Firebase token payload dict on success.

    Raises:
      HTTP 401  – missing/malformed header, invalid, or expired token.
      HTTP 403  – valid token with missing/unverified email or an email not
                  in the allowlist.
      HTTP 503  – Firebase Admin / configuration failure (not a 401).
    """
    # --- 1. Extract Bearer token ------------------------------------------
    if not http_creds or not http_creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token: str = http_creds.credentials

    # --- 2. Initialize Firebase Admin ----------------------------------------
    try:
        _get_firebase_app()
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again later.",
        )

    # --- 3. Verify the ID token ----------------------------------------------
    try:
        decoded: dict[str, Any] = firebase_auth.verify_id_token(
            token,
            check_revoked=True,
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.CertificateFetchError:
        logger.error("Firebase certificate retrieval failed during token verification.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again later.",
        )
    except (
        firebase_auth.InvalidIdTokenError,
        firebase_auth.RevokedIdTokenError,
        ValueError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        # Unexpected error from Firebase — treat as service failure, not auth failure.
        logger.error("Unexpected error during token verification.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again later.",
        )

    # --- 4. Require a verified email -----------------------------------------
    email = decoded.get("email")
    email_verified = decoded.get("email_verified")

    if not isinstance(email, str) or not email.strip() or email_verified is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    # --- 5. Normalize and check the allowlist --------------------------------
    allowed_emails = settings.allowed_emails_set
    if not allowed_emails:
        logger.error("ALLOWED_EMAILS is not configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again later.",
        )

    normalized_email = email.strip().lower()
    if normalized_email not in allowed_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    return decoded
