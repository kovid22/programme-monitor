import math
import threading
import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass


@dataclass(frozen=True)
class RateLimitResult:
    detail: str
    retry_after: int


class ActivitiesRateLimiter:
    """In-memory, per-user limits for the authenticated activities endpoint."""

    def __init__(
        self,
        clock: Callable[[], float] = time.monotonic,
        request_limit: int = 60,
        request_window_seconds: int = 60,
        refresh_cooldown_seconds: int = 30,
    ) -> None:
        self._clock = clock
        self._request_limit = request_limit
        self._request_window_seconds = request_window_seconds
        self._refresh_cooldown_seconds = refresh_cooldown_seconds
        self._request_times: dict[str, deque[float]] = {}
        self._last_refresh: dict[str, float] = {}
        self._lock = threading.Lock()

    def check(self, email: str, force_refresh: bool) -> RateLimitResult | None:
        """Record an accepted request or return the applicable rate-limit result."""
        now = self._clock()

        with self._lock:
            self._remove_stale_entries(now)
            request_times = self._request_times.setdefault(email, deque())

            if len(request_times) >= self._request_limit:
                retry_after = max(
                    1,
                    math.ceil(
                        self._request_window_seconds - (now - request_times[0])
                    ),
                )
                return RateLimitResult(
                    detail="Too many requests. Please try again shortly.",
                    retry_after=retry_after,
                )

            if force_refresh:
                last_refresh = self._last_refresh.get(email)
                if last_refresh is not None:
                    remaining = self._refresh_cooldown_seconds - (now - last_refresh)
                    if remaining > 0:
                        return RateLimitResult(
                            detail="Data was refreshed recently. Please wait before refreshing again.",
                            retry_after=max(1, math.ceil(remaining)),
                        )

            request_times.append(now)
            if force_refresh:
                self._last_refresh[email] = now
            return None

    def _remove_stale_entries(self, now: float) -> None:
        for email, request_times in list(self._request_times.items()):
            while (
                request_times
                and now - request_times[0] >= self._request_window_seconds
            ):
                request_times.popleft()
            if not request_times:
                del self._request_times[email]

        for email, last_refresh in list(self._last_refresh.items()):
            if now - last_refresh >= self._refresh_cooldown_seconds:
                del self._last_refresh[email]
