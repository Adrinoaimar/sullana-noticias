#!/usr/bin/env python3
"""Conservative Playwright capture for publicly visible Facebook Page posts."""

from __future__ import annotations

import base64
import binascii
import json
import logging
import os
import re
from datetime import datetime
from typing import Any
from urllib.parse import parse_qs, urljoin, urlsplit, urlunsplit

try:
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    from playwright.sync_api import sync_playwright
except ImportError as exc:  # pragma: no cover - exercised by runner setup
    PlaywrightTimeoutError = TimeoutError
    sync_playwright = None
    PLAYWRIGHT_IMPORT_ERROR = str(exc)
else:
    PLAYWRIGHT_IMPORT_ERROR = None


logger = logging.getLogger(__name__)

_MONTHS = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "setiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}
_EN_MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}
_RELATIVE_DATE = re.compile(r"^(?:just now|ahora|\d+\s*(?:s|sec|min|m|h|hr|hrs|d|day|days|w|week|weeks|mo|month|months|m|día|días|semana|semanas))$", re.I)
_POST_PATH = re.compile(r"/(?:posts|permalink\.php)(?:/|$)", re.I)
_STOP_LINES = {
    "all reactions:",
    "like",
    "comment",
    "share",
    "view more comments",
    "see translation",
    "write a comment",
    "most relevant",
}


def _clean_line(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def _canonical_post_url(value: str) -> str | None:
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc.lower().endswith("facebook.com"):
        return None
    query = parse_qs(parsed.query)
    keep = []
    for key in ("story_fbid", "fbid", "id"):
        for item in query.get(key, []):
            keep.append(f"{key}={item}")
    return urlunsplit(("https", "www.facebook.com", parsed.path.rstrip("/"), "&".join(keep), ""))


def _post_id(value: str) -> str | None:
    parsed = urlsplit(value)
    parts = [part for part in parsed.path.split("/") if part]
    for index, part in enumerate(parts[:-1]):
        if part.lower() == "posts":
            return parts[index + 1]
    query = parse_qs(parsed.query)
    return next((query[key][0] for key in ("story_fbid", "fbid", "id") if query.get(key)), None)


def _published_value(label: str) -> str | None:
    label = _clean_line(label)
    if not label:
        return None
    normalized = label.lower().replace("·", " ").strip()
    if _RELATIVE_DATE.fullmatch(normalized):
        # Preserve Facebook's relative label instead of inventing an exact time.
        return label
    match = re.search(r"(?P<day>\d{1,2})\s+(?:de\s+)?(?P<month>[A-Za-záéíóú]+)(?:\s+de)?\s+(?P<year>\d{4})", normalized)
    if not match:
        match = re.search(r"(?P<month>[A-Za-z]+)\s+(?P<day>\d{1,2}),?\s+(?P<year>\d{4})", normalized)
    if match:
        month_name = match.group("month").lower()
        month = _MONTHS.get(month_name) or _EN_MONTHS.get(month_name)
        if month:
            try:
                return datetime(int(match.group("year")), month, int(match.group("day"))).date().isoformat()
            except ValueError:
                return label
    numeric = re.search(r"\b(?P<day>\d{1,2})[/-](?P<month>\d{1,2})[/-](?P<year>\d{4})\b", normalized)
    if numeric:
        try:
            return datetime(int(numeric.group("year")), int(numeric.group("month")), int(numeric.group("day"))).date().isoformat()
        except ValueError:
            return label
    return label


class PlaywrightFacebookSourceAdapter:
    """Capture public Page articles while leaving normalization downstream."""

    def __init__(self, page_limit: int = 3, timeout: int = 25, scroll_limit: int = 2):
        self.page_limit = max(1, min(int(page_limit), 10))
        self.timeout = max(5, min(int(timeout), 60))
        self.scroll_limit = max(0, min(int(scroll_limit), 5))
        self.storage_state = self._storage_state()

    @staticmethod
    def _storage_state() -> dict[str, Any] | None:
        encoded = os.getenv("FACEBOOK_STORAGE_STATE_B64", "").strip()
        if not encoded:
            return None
        try:
            decoded = base64.b64decode(encoded, validate=True)
            state = json.loads(decoded)
        except (binascii.Error, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            raise RuntimeError(f"Invalid FACEBOOK_STORAGE_STATE_B64: {type(exc).__name__}") from None
        if not isinstance(state, dict) or not isinstance(state.get("cookies", []), list):
            raise RuntimeError("Invalid Facebook storage state shape")
        return state

    @staticmethod
    def _page_url(source: dict[str, Any]) -> tuple[str, str]:
        identifier = str(source.get("facebook_identifier") or "").strip().strip("/")
        source_url = str(source.get("facebook_url") or "").strip()
        parsed = urlsplit(source_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc.lower().endswith("facebook.com"):
            raise ValueError("Only public Facebook Page URLs are allowed")
        if not identifier or identifier.startswith(("groups/", "profile.php")) or not re.fullmatch(r"[A-Za-z0-9._-]+", identifier):
            raise ValueError("Invalid public Facebook Page identifier")
        path = "/" + "/".join(part for part in parsed.path.split("/") if part)
        if not path.lower().startswith(f"/{identifier.lower()}"):
            raise ValueError("Facebook URL and identifier do not match")
        return f"https://www.facebook.com/{identifier}/", identifier

    @staticmethod
    def _date_label(lines: list[str]) -> tuple[int, str | None]:
        for index, line in enumerate(lines):
            candidate = _clean_line(line).rstrip("·").strip()
            if _RELATIVE_DATE.fullmatch(candidate) or re.search(r"\b\d{4}\b", candidate) and re.search(r"[A-Za-záéíóú]", candidate):
                return index, candidate
            if re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b", candidate):
                return index, candidate
        return -1, None

    @staticmethod
    def _text_from_lines(lines: list[str], date_index: int, page_name: str) -> str:
        start = date_index + 1 if date_index >= 0 else 0
        content: list[str] = []
        for raw_line in lines[start:]:
            line = _clean_line(raw_line)
            lowered = line.lower()
            if lowered in _STOP_LINES or lowered.startswith("all reactions"):
                break
            if not line or line in {"·", "…"} or re.fullmatch(r"\+\d+", line):
                continue
            if line == page_name:
                continue
            line = re.sub(r"\s*(?:…|\.\.\.)?\s*See more\s*$", "", line, flags=re.I).strip()
            if line and line not in content:
                content.append(line)
        return "\n".join(content).strip()

    @staticmethod
    def _permalink(article: Any, identifier: str) -> str | None:
        candidates: list[str] = []
        count = article.locator("a").count()
        for index in range(count):
            anchor = article.locator("a").nth(index)
            href = anchor.get_attribute("href") or ""
            if not href or "comment_id=" in href:
                continue
            absolute = urljoin("https://www.facebook.com/", href)
            parsed = urlsplit(absolute)
            if _POST_PATH.search(parsed.path) and identifier.lower() in parsed.path.lower():
                canonical = _canonical_post_url(absolute)
                if canonical:
                    candidates.append(canonical)
        return candidates[0] if candidates else None

    def _extract_article(self, article: Any, source: dict[str, Any], identifier: str) -> dict[str, Any] | None:
        try:
            try:
                more = article.get_by_text("See more", exact=True).first
                if more.count():
                    more.click(timeout=1000)
            except Exception:
                pass
            permalink = self._permalink(article, identifier)
            if not permalink:
                return None
            lines = [_clean_line(line) for line in article.inner_text(timeout=self.timeout * 1000).splitlines()]
            date_index, date_label = self._date_label(lines)
            text = self._text_from_lines(lines, date_index, str(source.get("name") or ""))
            if not text or not date_label:
                return None
            return {
                "source_id": source.get("id"),
                "source_url": source.get("facebook_url"),
                "page_identifier": identifier,
                "post_id": _post_id(permalink),
                "page_name": source.get("name"),
                "text": text,
                "published_at": _published_value(date_label),
                "published_at_raw": date_label,
                "post_url": permalink,
                "image": None,
                "likes": None,
                "comments": None,
                "shares": None,
                "reactions": None,
            }
        except (PlaywrightTimeoutError, ValueError):
            return None

    def fetch(self, source: dict[str, Any]) -> list[dict[str, Any]]:
        if sync_playwright is None:
            raise RuntimeError(f"playwright unavailable: {PLAYWRIGHT_IMPORT_ERROR}")
        page_url, identifier = self._page_url(source)
        logger.info("opening source=%s url=%s", source.get("name", "unknown"), page_url)
        posts: list[dict[str, Any]] = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context_kwargs: dict[str, Any] = {"locale": "en-US", "viewport": {"width": 1365, "height": 900}}
            if self.storage_state:
                context_kwargs["storage_state"] = self.storage_state
            context = browser.new_context(**context_kwargs)
            page = context.new_page()
            page.set_default_timeout(self.timeout * 1000)
            try:
                page.goto(page_url, wait_until="domcontentloaded", timeout=self.timeout * 1000)
                page.wait_for_timeout(2500)
                for _ in range(self.scroll_limit):
                    page.mouse.wheel(0, 2200)
                    page.wait_for_timeout(1500)
                articles = page.locator("div[role='article']")
                for index in range(min(articles.count(), self.page_limit * 4)):
                    post = self._extract_article(articles.nth(index), source, identifier)
                    if post and post["post_url"] not in {item["post_url"] for item in posts}:
                        posts.append(post)
                    if len(posts) >= self.page_limit:
                        break
            finally:
                context.close()
                browser.close()
        if not posts:
            raise RuntimeError("No public Facebook posts parsed; page may require JS/session or have no readable posts")
        logger.info("source=%s posts=%d", source.get("name", "unknown"), len(posts))
        return posts
