#!/usr/bin/env python3
"""Public Facebook Page ingestor using the Playwright capture adapter."""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from playwright_adapter import PlaywrightFacebookSourceAdapter


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _capture_source(
    source: dict[str, Any],
    page_limit: int,
    timeout: int,
    scroll_limit: int,
    retries: int,
) -> tuple[dict[str, Any], list[dict[str, Any]], Exception | None]:
    last_error: Exception | None = None
    posts: list[dict[str, Any]] = []
    for attempt in range(retries + 1):
        try:
            logger.info("source=%s attempt=%d/%d", source.get("name", "unknown"), attempt + 1, retries + 1)
            adapter = PlaywrightFacebookSourceAdapter(page_limit, timeout, scroll_limit)
            posts = adapter.fetch(source)
            last_error = None
            break
        except Exception as exc:  # a source cannot take down another source
            last_error = exc
            if attempt < retries:
                time.sleep(min(60, 2**attempt))
    return source, posts, last_error


def main() -> int:
    request = json.load(sys.stdin)
    page_limit = max(1, min(int(request.get("page_limit", 8)), 10))
    timeout = max(5, min(int(request.get("timeout", 25)), 60))
    scroll_limit = max(0, min(int(request.get("scroll_limit", 3)), 5))
    retries = max(0, min(int(request.get("retries", os.getenv("SCRAPER_RETRIES", "2"))), 4))
    min_interval = max(0, min(int(request.get("min_interval", os.getenv("SCRAPER_MIN_INTERVAL_SECONDS", "30"))), 300))
    max_workers = max(1, min(int(request.get("max_workers", os.getenv("SCRAPER_MAX_WORKERS", "2"))), 3))
    sources = list(request.get("sources", []))
    all_posts: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for batch_index in range(0, len(sources), max_workers):
        if batch_index and min_interval:
            time.sleep(min_interval)
        batch = sources[batch_index : batch_index + max_workers]
        logger.info("batch=%d sources=%d max_workers=%d", batch_index // max_workers + 1, len(batch), max_workers)
        with ThreadPoolExecutor(max_workers=min(max_workers, len(batch)), thread_name_prefix="facebook-source") as executor:
            results = list(
                executor.map(
                    lambda source: _capture_source(source, page_limit, timeout, scroll_limit, retries),
                    batch,
                )
            )
        for source, posts, last_error in results:
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
