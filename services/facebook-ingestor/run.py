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
from datetime import datetime
from typing import Any, Iterable

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

    def fetch(self, source: dict[str, Any]) -> list[dict[str, Any]]:
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
    all_posts: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for source in request.get("sources", []):
        try:
            posts = adapter.fetch(source)
            all_posts.extend(posts)
            if not posts:
                errors.append({"source": source.get("name", "unknown"), "message": "No public posts parsed; Facebook may require JS/login or the page may have no readable public posts."})
        except Exception as exc:  # a source cannot take down another source
            errors.append({"source": source.get("name", "unknown"), "message": str(exc)})
    json.dump({"posts": all_posts, "errors": errors}, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
