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
_RELATIVE_DATE = re.compile(
    r"^(?:just now|ahora|today|yesterday|hoy|ayer|\d+\s*"
    r"(?:s|sec|min|m|h|hr|hrs|d|day|days|w|week|weeks|mo|month|months|m|día|días|semana|semanas))"
    r"(?:\s+(?:at|a las)\s+\d{1,2}:\d{2}\s*(?:am|pm)?)?$",
    re.I,
)
_POST_PATH = re.compile(r"/(?:posts|reel|permalink\.php)(?:/|$)", re.I)
_MEDIA_HOSTS = {"facebook.com", "fbcdn.net", "fbsbx.com"}
_PROFILE_MEDIA_LABEL = re.compile(r"(?:profile|perfil|avatar|logo|icon|ícono|icono)", re.I)
_STOP_LINES = {
    "all reactions:",
    "todas las reacciones:",
    "like",
    "me gusta",
    "comment",
    "comentar",
    "share",
    "compartir",
    "view more comments",
    "ver más comentarios",
    "see translation",
    "ver traducción",
    "write a comment",
    "escribe un comentario",
    "most relevant",
}


def _clean_line(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def _reaction_boundary_index(lines: list[str]) -> int:
    for index, line in enumerate(lines):
        lowered = _clean_line(line).lower()
        if re.search(r"(?:all\s+reactions|todas\s+las\s+reacciones|reacciones)", lowered) and len(lowered) < 100:
            return index
    return len(lines)


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
        if part.lower() in {"posts", "reel"}:
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


def _public_media_url(value: Any) -> str | None:
    """Keep only public Facebook/CDN media URLs; never return blob/data URLs."""
    raw = str(value or "").strip()
    if not raw:
        return None
    parsed = urlsplit(urljoin("https://www.facebook.com/", raw))
    hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme not in {"http", "https"} or not any(
        hostname == domain or hostname.endswith(f".{domain}") for domain in _MEDIA_HOSTS
    ):
        return None
    return urlunsplit(("https", parsed.netloc, parsed.path, parsed.query, ""))


def _srcset_candidates(value: Any) -> list[str]:
    candidates: list[str] = []
    for item in str(value or "").split(","):
        candidate = item.strip().split(" ", 1)[0]
        if candidate:
            candidates.append(candidate)
    return candidates


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
        candidates: list[tuple[int, str]] = []
        for index, line in enumerate(lines):
            candidate = _clean_line(line).rstrip("·").strip()
            if _RELATIVE_DATE.fullmatch(candidate) or re.search(r"\b\d{4}\b", candidate) and re.search(r"[A-Za-záéíóú]", candidate):
                candidates.append((index, candidate))
            elif re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b", candidate):
                candidates.append((index, candidate))
            elif re.search(r"\b\d{1,2}:\d{2}\b", candidate) and len(candidate) <= 80:
                # Localized labels may use punctuation or a.m./p.m. variants
                # that are not worth normalizing; preserve the visible value.
                candidates.append((index, candidate))
        if not candidates:
            return (-1, None)
        # The post timestamp is in Facebook's compact header. Comment times
        # can be rendered much later in the same article, so prefer the last
        # candidate in the first header lines before consulting separators.
        header_candidates = [item for item in candidates if item[0] <= 6]
        if header_candidates:
            return header_candidates[-1]
        # Comment timestamps (for example "3h") can appear after the post
        # body. Use the last date before Facebook's reactions/comments block;
        # duplicated page/date headers still resolve to the second header.
        reaction_index = _reaction_boundary_index(lines)
        pre_reaction_candidates = [item for item in candidates if item[0] < reaction_index]
        return (pre_reaction_candidates or candidates)[-1]

    @staticmethod
    def _text_from_lines(lines: list[str], date_index: int, page_name: str) -> str:
        start = date_index + 1 if date_index >= 0 else 0
        content: list[str] = []
        for raw_line in lines[start:]:
            line = _clean_line(raw_line)
            lowered = line.lower()
            if lowered in _STOP_LINES or re.search(r"(?:all\s+reactions|todas\s+las\s+reacciones|reacciones)", lowered):
                break
            if not line or line in {"·", "…"} or re.fullmatch(r"\+\d+", line):
                continue
            if line == page_name:
                continue
            had_see_more = bool(re.search(r"See more\s*$", line, flags=re.I))
            line = re.sub(r"\s*(?:…|\.\.\.)?\s*See more\s*$", "", line, flags=re.I).strip()
            if had_see_more and len(line) <= 3:
                continue
            if _RELATIVE_DATE.fullmatch(line) or re.search(r"\b\d{4}\b", line) and re.search(r"[A-Za-záéíóú]", line):
                continue
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
            is_reel = re.search(r"/reel(?:/|$)", parsed.path, re.I)
            if _POST_PATH.search(parsed.path) and (identifier.lower() in parsed.path.lower() or is_reel):
                canonical = _canonical_post_url(absolute)
                if canonical:
                    candidates.append(canonical)
        return candidates[0] if candidates else None

    @staticmethod
    def _media(article: Any) -> list[dict[str, Any]]:
        """Extract public media metadata from the visible article DOM.

        URLs are retained as references only. The Worker does not download or
        republish third-party media automatically; signed CDN URLs may expire.
        """
        media: list[dict[str, Any]] = []
        seen: set[str] = set()

        try:
            images = article.locator("img").evaluate_all(
                """nodes => nodes.map(node => ({
                    src: node.currentSrc || node.src || node.getAttribute('data-src') || '',
                    srcset: node.getAttribute('srcset') || '',
                    alt: node.getAttribute('alt') || node.getAttribute('aria-label') || ''
                }))"""
            )
        except Exception:
            images = []
        for item in images if isinstance(images, list) else []:
            if not isinstance(item, dict):
                continue
            candidates = [item.get("src"), *_srcset_candidates(item.get("srcset"))]
            alt = _clean_line(item.get("alt") or "")
            if _PROFILE_MEDIA_LABEL.search(alt):
                continue
            url = None
            for candidate in candidates:
                url = _public_media_url(candidate)
                if url:
                    break
            if url and url not in seen:
                media.append({"kind": "image", "url": url, "alt": alt[:160]})
                seen.add(url)
            if len(media) >= 6:
                return media

        try:
            videos = article.locator("video, video source").evaluate_all(
                """nodes => nodes.map(node => ({
                    src: node.currentSrc || node.src || node.getAttribute('src') || '',
                    poster: node.poster || node.getAttribute('poster') || ''
                }))"""
            )
        except Exception:
            videos = []
        for item in videos if isinstance(videos, list) else []:
            if not isinstance(item, dict):
                continue
            url = _public_media_url(item.get("src"))
            poster = _public_media_url(item.get("poster"))
            if not url and not poster:
                continue
            key = url or poster
            if key in seen:
                continue
            entry: dict[str, Any] = {"kind": "video", "url": url}
            if poster:
                entry["poster"] = poster
            media.append(entry)
            seen.add(key)
            if len(media) >= 6:
                break
        return media

    def _extract_article(self, article: Any, source: dict[str, Any], identifier: str) -> dict[str, Any] | None:
        try:
            for label in ("See more", "Ver más"):
                try:
                    more = article.get_by_text(label, exact=True).first
                    if more.count():
                        more.click(timeout=1000)
                        break
                except Exception:
                    continue
            permalink = self._permalink(article, identifier)
            if not permalink:
                logger.info(
                    "source=%s article_skip=no_permalink anchors=%d",
                    source.get("name", "unknown"),
                    article.locator("a").count(),
                )
                return None
            lines = [_clean_line(line) for line in article.inner_text(timeout=self.timeout * 1000).splitlines()]
            date_index, date_label = self._date_label(lines)
            text = self._text_from_lines(lines, date_index, str(source.get("name") or ""))
            if not text or not date_label:
                logger.info(
                    "source=%s article_skip=missing_fields date=%s date_index=%d text_len=%d lines=%d",
                    source.get("name", "unknown"),
                    bool(date_label),
                    date_index,
                    len(text),
                    len(lines),
                )
                return None
            media = self._media(article)
            images = [item for item in media if item.get("kind") == "image"]
            videos = [item for item in media if item.get("kind") == "video"]
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
                "media": media,
                "image": images[0]["url"] if images else None,
                "video": videos[0].get("url") if videos else None,
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
                # Facebook may place a public login prompt above the feed.
                # Dismiss only the visible close control; never submit credentials.
                try:
                    close_prompt = page.get_by_role("button", name="Cerrar", exact=True).first
                    if close_prompt.count():
                        close_prompt.click(timeout=1000)
                        page.wait_for_timeout(500)
                except Exception:
                    pass
                for _ in range(self.scroll_limit):
                    page.mouse.wheel(0, 2200)
                    page.wait_for_timeout(1500)
                articles = page.locator("div[role='article']")
                try:
                    articles.first.wait_for(state="attached", timeout=min(self.timeout * 1000, 8000))
                except PlaywrightTimeoutError:
                    pass
                article_count = articles.count()
                logger.info("source=%s articles=%d", source.get("name", "unknown"), article_count)
                for index in range(min(article_count, self.page_limit * 4)):
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
