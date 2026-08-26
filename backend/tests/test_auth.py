"""
Tests for Phase 2A Firebase auth dependency.

All Firebase token verification is mocked. No real Firebase project,
network access, or credentials are required.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Helpers — build a valid decoded-token payload
# ---------------------------------------------------------------------------

def _make_decoded(
    email: str = "approved@example.com",
    email_verified: bool = True,
) -> dict:
    return {
        "uid": "test-uid-123",
        "email": email,
        "email_verified": email_verified,
    }


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def client(monkeypatch):
    """
    Return a TestClient wired with a patched settings object that has
    one approved email and a dummy project ID.  Firebase Admin itself
    is patched so no real initialization happens.
    """
    # Patch settings to include our test approved email.
    from app import config as config_module
    monkeypatch.setattr(
        config_module.settings,
        "FIREBASE_PROJECT_ID",
        "test-project",
        raising=False,
    )
    monkeypatch.setattr(
        config_module.settings,
        "ALLOWED_EMAILS",
        "approved@example.com , ALSO.APPROVED@EXAMPLE.COM",
        raising=False,
    )

    # Prevent real Firebase initialization.
    with patch("app.auth._get_firebase_app", return_value=MagicMock()):
        from app.main import app
        yield TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# /api/health — must remain public
# ---------------------------------------------------------------------------

def test_health_is_public(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# /api/activities — missing token
# ---------------------------------------------------------------------------

def test_activities_no_token_returns_401(client):
    resp = client.get("/api/activities")
    assert resp.status_code == 401
    assert resp.headers["www-authenticate"] == "Bearer"


def test_activities_malformed_header_returns_401(client):
    resp = client.get("/api/activities", headers={"Authorization": "NotBearer xyz"})
    assert resp.status_code == 401
    assert resp.headers["www-authenticate"] == "Bearer"


def test_force_refresh_does_not_bypass_auth(client):
    with patch("app.main.fetch_activities_with_timestamp") as fetch_activities:
        resp = client.get("/api/activities?force_refresh=true")
    assert resp.status_code == 401
    fetch_activities.assert_not_called()


# ---------------------------------------------------------------------------
# /api/activities — invalid / expired tokens (Firebase raises)
# ---------------------------------------------------------------------------

def test_activities_invalid_token_returns_401(client):
    from firebase_admin.auth import InvalidIdTokenError
    with patch(
        "app.auth.firebase_auth.verify_id_token",
        side_effect=InvalidIdTokenError("bad token"),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
    assert resp.status_code == 401
    assert resp.headers["www-authenticate"] == "Bearer"


def test_activities_expired_token_returns_401(client):
    from firebase_admin.auth import ExpiredIdTokenError
    with patch(
        "app.auth.firebase_auth.verify_id_token",
        side_effect=ExpiredIdTokenError("expired", cause=None),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer expired.token.here"},
        )
    assert resp.status_code == 401
    assert resp.headers["www-authenticate"] == "Bearer"


# ---------------------------------------------------------------------------
# /api/activities — valid token but missing or unsuitable identity claims
# ---------------------------------------------------------------------------

def test_activities_missing_email_returns_403(client):
    decoded = _make_decoded()
    decoded.pop("email")
    with patch("app.auth.firebase_auth.verify_id_token", return_value=decoded):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 403

def test_activities_unapproved_email_returns_403(client):
    with patch(
        "app.auth.firebase_auth.verify_id_token",
        return_value=_make_decoded(email="stranger@example.com"),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 403


def test_activities_unverified_email_returns_403(client):
    with patch(
        "app.auth.firebase_auth.verify_id_token",
        return_value=_make_decoded(
            email="approved@example.com",
            email_verified=False,
        ),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# /api/activities — approved user passes auth (data layer mocked)
# ---------------------------------------------------------------------------

def test_activities_approved_user_passes_auth(client):
    with (
        patch(
            "app.auth.firebase_auth.verify_id_token",
            return_value=_make_decoded(),
        ),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], "2026-08-26T00:00:00Z")),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"activities": [], "count": 0}
    assert resp.headers["x-data-refreshed-at"] == "2026-08-26T00:00:00Z"


# ---------------------------------------------------------------------------
# Case-insensitivity and whitespace handling in allowlist
# ---------------------------------------------------------------------------

def test_approved_email_matching_is_case_insensitive(client):
    """Token with uppercase email should match lowercase allowlist entry."""
    with (
        patch(
            "app.auth.firebase_auth.verify_id_token",
            return_value=_make_decoded(email="Approved@Example.COM"),
        ),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 200


def test_also_approved_email_with_surrounding_whitespace_in_config(client):
    """Entry with whitespace around it in ALLOWED_EMAILS is still matched."""
    with (
        patch(
            "app.auth.firebase_auth.verify_id_token",
            return_value=_make_decoded(email="also.approved@example.com"),
        ),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 200


@pytest.mark.parametrize("allowlist", ["", " , "])
def test_empty_allowlist_returns_503(client, monkeypatch, allowlist):
    from app.config import settings

    monkeypatch.setattr(settings, "ALLOWED_EMAILS", allowlist)
    with patch(
        "app.auth.firebase_auth.verify_id_token",
        return_value=_make_decoded(),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 503


# ---------------------------------------------------------------------------
# /api/activities — Firebase service failure must NOT produce 401
# ---------------------------------------------------------------------------

def test_firebase_service_failure_returns_503_not_401(client):
    with patch(
        "app.auth._get_firebase_app",
        side_effect=RuntimeError("Firebase Admin initialization failed"),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer any.token.here"},
        )
    assert resp.status_code == 503


def test_token_verification_service_failure_returns_503_not_401(client):
    with patch(
        "app.auth.firebase_auth.verify_id_token",
        side_effect=RuntimeError("Firebase service unavailable"),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 503


def test_certificate_fetch_failure_returns_503_without_auth_challenge(client):
    from firebase_admin.auth import CertificateFetchError

    with patch(
        "app.auth.firebase_auth.verify_id_token",
        side_effect=CertificateFetchError("certificate service unavailable", cause=None),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert resp.status_code == 503
    assert "www-authenticate" not in resp.headers


# ---------------------------------------------------------------------------
# Firebase Admin initialization — configuration must fail closed
# ---------------------------------------------------------------------------

def test_existing_firebase_app_is_reused_without_reinitializing():
    from app import auth as auth_module

    existing_app = MagicMock()
    with (
        patch("app.auth.firebase_admin.get_app", return_value=existing_app),
        patch("app.auth.firebase_admin.initialize_app") as initialize_app,
    ):
        result = auth_module._get_firebase_app()

    assert result is existing_app
    initialize_app.assert_not_called()


def test_firebase_service_account_uses_configured_project_id(monkeypatch):
    from app import auth as auth_module
    from app.config import settings

    service_account_info = {"type": "service_account", "project_id": "key-project"}
    credential = MagicMock()
    app = MagicMock()
    monkeypatch.setattr(settings, "FIREBASE_PROJECT_ID", "configured-project")
    monkeypatch.setattr(
        settings,
        "FIREBASE_SERVICE_ACCOUNT_JSON",
        '{"type":"service_account","project_id":"key-project"}',
    )
    with (
        patch("app.auth.firebase_admin.get_app", side_effect=ValueError),
        patch("app.auth.credentials.Certificate", return_value=credential) as certificate,
        patch("app.auth.firebase_admin.initialize_app", return_value=app) as initialize_app,
    ):
        result = auth_module._get_firebase_app()

    assert result is app
    certificate.assert_called_once_with(service_account_info)
    initialize_app.assert_called_once_with(credential, {"projectId": "configured-project"})

def test_malformed_firebase_service_account_json_does_not_fall_back_to_adc(
    monkeypatch,
):
    from app import auth as auth_module
    from app.config import settings

    monkeypatch.setattr(settings, "FIREBASE_SERVICE_ACCOUNT_JSON", "{not-json")
    with (
        patch("app.auth.firebase_admin.get_app", side_effect=ValueError),
        patch("app.auth.firebase_admin.initialize_app") as initialize_app,
        patch("app.auth.credentials.ApplicationDefault") as application_default,
        pytest.raises(RuntimeError, match="Firebase Admin initialization failed"),
    ):
        auth_module._get_firebase_app()

    initialize_app.assert_not_called()
    application_default.assert_not_called()
