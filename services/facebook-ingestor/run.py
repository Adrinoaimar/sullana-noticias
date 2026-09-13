#!/usr/bin/env python3
"""Public Facebook page ingestor.

facebook-scraper remains replaceable behind FacebookSourceAdapter. This module
does not log in, load cookies, access groups, or fetch private profiles.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

try:
    from facebook_scraper import get_posts
except ImportError as exc:  # pragma: no cover - exercised by deployment health check
    get_posts = None
    IMPORT_ERROR = str(exc)
else:
    IMPORT_ERROR = None


class FacebookSourceAdapter:
    """Owns the dependency-specific Facebook extraction contract."""

    def __init__(self, page_limit: int = 3, timeout: int = 25):
        self.page_limit = max(1, min(int(page_limit), 10))
        self.timeout = max(5, min(int(timeout), 60))
        self.meta_token = os.getenv("META_PAGE_ACCESS_TOKEN", "").strip()
        self.meta_graph_api_version = os.getenv("META_GRAPH_API_VERSION", "v26.0").strip()
        if self.meta_token and not re.fullmatch(r"v\d+\.\d+", self.meta_graph_api_version):
            raise ValueError("META_GRAPH_API_VERSION must look like v26.0")

    @staticmethod
    def _identifier(source: dict[str, Any]) -> str:
        identifier = str(source.get("facebook_identifier") or "").strip().strip("/")
        if not identifier or identifier.startswith("groups/") or identifier.startswith("profile.php"):
            raise ValueError("Only public Facebook pages are allowed")
        if not re.fullmatch(r"[A-Za-z0-9._-]+", identifier):
            raise ValueError("Invalid public page identifier")
        return identifier

    @staticmethod
    def _iso(value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    @staticmethod
    def _total_count(value: Any) -> int | None:
        if isinstance(value, dict):
            summary = value.get("summary")
            if isinstance(summary, dict) and summary.get("total_count") is not None:
                try:
                    return int(summary["total_count"])
                except (TypeError, ValueError):
                    return None
        return None

    def _graph_get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        """Call Meta without putting the token in logs or exception messages."""
        query = urlencode({key: value for key, value in params.items() if value is not None})
        url = f"https://graph.facebook.com/{self.meta_graph_api_version}/{path}?{query}"
        try:
            with urlopen(Request(url, headers={"User-Agent": "SullanaNoticiasIngest/1.0"}), timeout=self.timeout) as response:
                payload = json.loads(response.read())
        except HTTPError as exc:
            # Do not include the URL: it contains the access token.
            detail = ""
            try:
                body = json.loads(exc.read()).get("error", {})
                detail = str(body.get("message") or "").strip()
            except (OSError, ValueError, AttributeError):
                pass
            raise RuntimeError(f"Meta Graph API HTTP {exc.code}{': ' + detail if detail else ''}") from None
        except (URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"Meta Graph API request failed: {type(exc).__name__}") from None
        if not isinstance(payload, dict):
            raise RuntimeError("Meta Graph API returned an invalid JSON object")
        if payload.get("error"):
            error = payload["error"]
            message = error.get("message") if isinstance(error, dict) else None
            raise RuntimeError(f"Meta Graph API error: {message or 'unknown error'}")
        return payload

    def _fetch_via_meta_graph(self, source: dict[str, Any]) -> list[dict[str, Any]]:
        identifier = self._identifier(source)
        # The token is supplied only through the runner secret. A source may
        # optionally provide a numeric Page ID to avoid username resolution.
        page_key = str(source.get("facebook_page_id") or identifier)
        page = self._graph_get(
            quote(page_key, safe=""),
            {"fields": "id,name", "access_token": self.meta_token},
        )
        page_id = str(page.get("id") or page_key)
        page_name = page.get("name") or source.get("name")
        fields = "id,message,created_time,permalink_url,full_picture,likes.limit(0).summary(true),comments.limit(0).summary(true),shares"
        payload = self._graph_get(
            f"{quote(page_id, safe='')}/posts",
            {"fields": fields, "limit": self.page_limit, "access_token": self.meta_token},
        )
        posts: list[dict[str, Any]] = []
        for raw in payload.get("data", []):
            if not isinstance(raw, dict):
                continue
            text = str(raw.get("message") or "").strip()
            post_url = raw.get("permalink_url")
            if not text or not post_url or not raw.get("id"):
                continue
            posts.append(
                {
                    "source_id": source.get("id"),
                    "source_url": source.get("facebook_url"),
                    "page_identifier": identifier,
                    "post_id": str(raw["id"]),
                    "page_name": page_name,
                    "text": text,
                    "published_at": self._iso(raw.get("created_time")),
                    "post_url": post_url,
                    "image": raw.get("full_picture"),
                    "likes": self._total_count(raw.get("likes")),
                    "comments": self._total_count(raw.get("comments")),
                    "shares": (raw.get("shares") or {}).get("count") if isinstance(raw.get("shares"), dict) else None,
                    "reactions": None,
                }
            )
        return posts

    def fetch(self, source: dict[str, Any]) -> list[dict[str, Any]]:
        if self.meta_token:
            return self._fetch_via_meta_graph(source)
        if get_posts is None:
            raise RuntimeError(f"facebook-scraper unavailable: {IMPORT_ERROR}")
        identifier = self._identifier(source)
        posts: list[dict[str, Any]] = []
        # No credentials/cookies: public-page discovery only.
        iterator: Iterable[dict[str, Any]] = get_posts(
            account=identifier,
            page_limit=self.page_limit,
            timeout=self.timeout,
            options={"allow_extra_requests": False},
        )
        for raw in iterator:
            text = str(raw.get("text") or raw.get("post_text") or "").strip()
            post_url = raw.get("post_url") or raw.get("w3_fb_url")
            if not text or not post_url:
                continue
            posts.append(
                {
                    "source_id": source.get("id"),
                    "source_url": source.get("facebook_url"),
                    "page_identifier": identifier,
                    "post_id": str(raw.get("post_id")) if raw.get("post_id") else None,
                    "page_name": raw.get("username") or source.get("name"),
                    "text": text,
                    "published_at": self._iso(raw.get("time")),
                    "post_url": post_url,
                    "image": raw.get("image") or (raw.get("images") or [None])[0],
                    "likes": raw.get("likes"),
                    "comments": raw.get("comments"),
                    "shares": raw.get("shares"),
                    "reactions": raw.get("reactions"),
                }
            )
        return posts


def main() -> int:
    request = json.load(sys.stdin)
    adapter = FacebookSourceAdapter(request.get("page_limit", 3), request.get("timeout", 25))
    retries = max(0, min(int(request.get("retries", os.getenv("SCRAPER_RETRIES", "2"))), 4))
    min_interval = max(0, min(int(request.get("min_interval", os.getenv("SCRAPER_MIN_INTERVAL_SECONDS", "30"))), 300))
    all_posts: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for index, source in enumerate(request.get("sources", [])):
        if index and min_interval:
            time.sleep(min_interval)
        last_error: Exception | None = None
        posts: list[dict[str, Any]] = []
        for attempt in range(retries + 1):
            try:
                posts = adapter.fetch(source)
                last_error = None
                break
            except Exception as exc:  # a source cannot take down another source
                last_error = exc
                if attempt < retries:
                    time.sleep(min(60, 2 ** attempt))
        if last_error is not None:
            errors.append({"source": source.get("name", "unknown"), "message": f"after {retries + 1} attempts: {last_error}"})
            continue
        all_posts.extend(posts)
        if not posts:
            errors.append({"source": source.get("name", "unknown"), "message": "No public posts parsed; Facebook may require JS/login or the page may have no readable public posts."})
    json.dump({"posts": all_posts, "errors": errors}, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
