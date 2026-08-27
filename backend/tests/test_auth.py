"""
Tests for Phase 2A Firebase auth dependency.

All Firebase token verification is mocked. No real Firebase project,
network access, or credentials are required.
"""

import logging

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


class MutableMonotonicClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


@pytest.fixture()
def rate_limit_clock(monkeypatch):
    from app import main
    from app.rate_limit import ActivitiesRateLimiter

    clock = MutableMonotonicClock()
    monkeypatch.setattr(main, "activities_rate_limiter", ActivitiesRateLimiter(clock=clock))
    return clock


# ---------------------------------------------------------------------------
# /api/health — must remain public
# ---------------------------------------------------------------------------

def test_health_is_public(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.fixture()
def cors_client(monkeypatch):
    from app.config import settings
    from app.main import create_app

    origin = "https://frontend.example.test"
    monkeypatch.setattr(settings, "FRONTEND_ORIGIN", origin)
    return TestClient(create_app()), origin


def test_configured_origin_receives_cors_headers(cors_client):
    client, origin = cors_client

    response = client.get("/api/health", headers={"Origin": origin})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-expose-headers"] == (
        "X-Data-Refreshed-At, Retry-After"
    )


def test_unapproved_origin_receives_no_cors_allow_origin(cors_client):
    client, _ = cors_client

    response = client.get(
        "/api/health",
        headers={"Origin": "https://unapproved.example.test"},
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_authorized_get_preflight_succeeds(cors_client):
    client, origin = cors_client

    response = client.options(
        "/api/activities",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-methods"] == "GET"
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_post_preflight_is_rejected(cors_client):
    client, origin = cors_client

    response = client.options(
        "/api/activities",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert "POST" not in response.headers["access-control-allow-methods"]


def test_unsupported_header_preflight_is_rejected(cors_client):
    client, origin = cors_client

    response = client.options(
        "/api/activities",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Unsupported-Header",
        },
    )

    assert response.status_code == 400
    assert "x-unsupported-header" not in response.headers[
        "access-control-allow-headers"
    ].lower()


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_documentation_endpoints_are_available_in_development(monkeypatch, path):
    from app.config import settings
    from app.main import create_app

    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    response = TestClient(create_app()).get(path)

    assert response.status_code == 200


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_documentation_endpoints_are_unavailable_in_production(monkeypatch, path):
    from app.config import settings
    from app.main import create_app

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = TestClient(create_app()).get(path)

    assert response.status_code == 404


def test_health_remains_available_in_production(monkeypatch):
    from app.config import settings
    from app.main import create_app

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = TestClient(create_app()).get("/api/health")

    assert response.status_code == 200


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
# /api/activities — safe programme-data errors
# ---------------------------------------------------------------------------

def test_value_error_response_and_logs_are_sanitized(client, caplog):
    marker = "SUPER_SECRET_INTERNAL_VALUE"
    caplog.set_level(logging.ERROR, logger="app.main")

    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch("app.main.fetch_activities_with_timestamp", side_effect=ValueError(marker)),
    ):
        response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert response.status_code == 500
    assert response.json() == {"detail": "Unable to load programme data."}
    assert marker not in response.text
    assert marker not in caplog.text


def test_unexpected_error_response_is_sanitized(client):
    marker = "SUPER_SECRET_INTERNAL_VALUE"

    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch("app.main.fetch_activities_with_timestamp", side_effect=RuntimeError(marker)),
    ):
        response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error."}
    assert marker not in response.text


def test_data_source_error_returns_safe_503(client):
    from app.services.google_sheets import ProgrammeDataSourceError

    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch(
            "app.main.fetch_activities_with_timestamp",
            side_effect=ProgrammeDataSourceError("SUPER_SECRET_INTERNAL_VALUE"),
        ),
    ):
        response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert response.status_code == 503
    assert response.json() == {"detail": "Programme data is temporarily unavailable."}
    assert "SUPER_SECRET_INTERNAL_VALUE" not in response.text


# ---------------------------------------------------------------------------
# /api/activities — per-user rate limits and refresh cooldown
# ---------------------------------------------------------------------------

def test_normal_requests_allow_60_then_return_429(client, rate_limit_clock):
    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        for _ in range(60):
            response = client.get(
                "/api/activities",
                headers={"Authorization": "Bearer valid.token.here"},
            )
            assert response.status_code == 200

        response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert response.status_code == 429
    assert response.json() == {"detail": "Too many requests. Please try again shortly."}
    assert int(response.headers["retry-after"]) >= 1
    assert client.get("/api/health").status_code == 200


def test_normal_rate_limits_are_independent_per_user(
    client,
    rate_limit_clock,
    monkeypatch,
):
    from app.config import settings

    monkeypatch.setattr(settings, "ALLOWED_EMAILS", "first@example.com,second@example.com")

    def verify_id_token(token, **_kwargs):
        return _make_decoded(email=f"{token}@example.com")

    with (
        patch("app.auth.firebase_auth.verify_id_token", side_effect=verify_id_token),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        for _ in range(60):
            response = client.get(
                "/api/activities",
                headers={"Authorization": "Bearer first"},
            )
            assert response.status_code == 200

        first_response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer first"},
        )
        second_response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer second"},
        )

    assert first_response.status_code == 429
    assert second_response.status_code == 200


def test_forced_refresh_has_per_user_cooldown(client, rate_limit_clock):
    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        first_response = client.get(
            "/api/activities?force_refresh=true",
            headers={"Authorization": "Bearer valid.token.here"},
        )
        cooldown_response = client.get(
            "/api/activities?force_refresh=true",
            headers={"Authorization": "Bearer valid.token.here"},
        )
        rate_limit_clock.advance(30)
        after_cooldown_response = client.get(
            "/api/activities?force_refresh=true",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert first_response.status_code == 200
    assert cooldown_response.status_code == 429
    assert cooldown_response.json() == {
        "detail": "Data was refreshed recently. Please wait before refreshing again."
    }
    assert 1 <= int(cooldown_response.headers["retry-after"]) <= 30
    assert after_cooldown_response.status_code == 200


def test_refresh_cooldown_rejections_do_not_consume_normal_quota(
    client,
    rate_limit_clock,
):
    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        first_refresh = client.get(
            "/api/activities?force_refresh=true",
            headers={"Authorization": "Bearer valid.token.here"},
        )
        for _ in range(10):
            cooldown_response = client.get(
                "/api/activities?force_refresh=true",
                headers={"Authorization": "Bearer valid.token.here"},
            )
            assert cooldown_response.status_code == 429

        for _ in range(59):
            normal_response = client.get(
                "/api/activities",
                headers={"Authorization": "Bearer valid.token.here"},
            )
            assert normal_response.status_code == 200

        limit_response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert first_refresh.status_code == 200
    assert limit_response.status_code == 429


def test_forced_refresh_cooldowns_are_independent_per_user(
    client,
    rate_limit_clock,
    monkeypatch,
):
    from app.config import settings

    monkeypatch.setattr(settings, "ALLOWED_EMAILS", "first@example.com,second@example.com")

    def verify_id_token(token, **_kwargs):
        return _make_decoded(email=f"{token}@example.com")

    with (
        patch("app.auth.firebase_auth.verify_id_token", side_effect=verify_id_token),
        patch("app.main.fetch_activities_with_timestamp", return_value=([], None)),
    ):
        first_response = client.get(
            "/api/activities?force_refresh=true",
            headers={"Authorization": "Bearer first"},
        )
        second_response = client.get(
            "/api/activities?force_refresh=true",
            headers={"Authorization": "Bearer second"},
        )

    assert first_response.status_code == 200
    assert second_response.status_code == 200


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


def test_activities_revoked_token_returns_401(client):
    from firebase_admin.auth import RevokedIdTokenError

    with patch(
        "app.auth.firebase_auth.verify_id_token",
        side_effect=RevokedIdTokenError("revoked"),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer revoked.token.here"},
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
        ) as verify_id_token,
        patch("app.main.fetch_activities_with_timestamp", return_value=([], "2026-08-26T00:00:00Z")),
    ):
        resp = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"activities": [], "count": 0}
    assert resp.headers["x-data-refreshed-at"] == "2026-08-26T00:00:00Z"
    verify_id_token.assert_called_once_with("valid.token.here", check_revoked=True)


def test_activities_serialization_preserves_target_timing(client):
    from app.models import Activity

    activity = Activity(
        id="1",
        component="Component A",
        subComponent="Sub-Component A",
        agency="DoE, JSV",
        agencies=["DoE", "JSV"],
        subAgency=None,
        title="Synthetic activity",
        estimatedValue=None,
        estimatedValueRaw="TBD",
        targetTiming="Within 1 month",
        targetDate=None,
        timelineStatus="To Be Confirmed",
        completionStatus="In Progress",
        pmcResourceAligned="Yes",
        remarks="Synthetic remark",
    )

    with (
        patch("app.auth.firebase_auth.verify_id_token", return_value=_make_decoded()),
        patch("app.main.fetch_activities_with_timestamp", return_value=([activity], None)),
    ):
        response = client.get(
            "/api/activities",
            headers={"Authorization": "Bearer valid.token.here"},
        )

    assert response.status_code == 200
    body = response.json()["activities"][0]
    assert body["targetTiming"] == "Within 1 month"
    assert body["targetDate"] is None
    assert body["agencies"] == ["DoE", "JSV"]


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
