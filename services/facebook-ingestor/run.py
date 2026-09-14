#!/usr/bin/env python3
"""Public Facebook Page ingestor using the Playwright capture adapter."""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from typing import Any

from playwright_adapter import PlaywrightFacebookSourceAdapter


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    request = json.load(sys.stdin)
    adapter = PlaywrightFacebookSourceAdapter(request.get("page_limit", 8), request.get("timeout", 25), request.get("scroll_limit", 3))
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
                logger.info("source=%s attempt=%d/%d", source.get("name", "unknown"), attempt + 1, retries + 1)
                posts = adapter.fetch(source)
                last_error = None
                break
            except Exception as exc:  # a source cannot take down another source
                last_error = exc
                if attempt < retries:
                    time.sleep(min(60, 2 ** attempt))
        if last_error is not None:
            message = f"after {retries + 1} attempts: {last_error}"
            logger.error("source=%s failed: %s", source.get("name", "unknown"), message)
            errors.append({"source": source.get("name", "unknown"), "source_id": source.get("id"), "page_identifier": source.get("facebook_identifier"), "message": message})
            continue
        all_posts.extend(posts)
        if not posts:
            message = "No public posts parsed; Facebook may require JS/session or the page may have no readable public posts."
            logger.error("source=%s failed: %s", source.get("name", "unknown"), message)
            errors.append({"source": source.get("name", "unknown"), "source_id": source.get("id"), "page_identifier": source.get("facebook_identifier"), "message": message})
        else:
            logger.info("source=%s captured=%d", source.get("name", "unknown"), len(posts))
    json.dump({"posts": all_posts, "errors": errors}, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
