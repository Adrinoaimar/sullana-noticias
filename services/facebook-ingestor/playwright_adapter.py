#!/usr/bin/env python3
"""Conservative Playwright capture for publicly visible Facebook Page posts."""

from __future__ import annotations

import base64
import binascii
import html
import json
import logging
import os
import re
from datetime import datetime
from typing import Any
from urllib.parse import parse_qs, urlencode, urljoin, urlsplit, urlunsplit

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
_CONTENT_PATH = re.compile(r"/(?:posts|reel|videos|permalink\.php|photo)(?:/|$)", re.I)
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


def _text_signature(value: str) -> set[str]:
    normalized = html.unescape(str(value or "")).lower()
    normalized = re.sub(r"[^a-záéíóúüñ0-9]+", " ", normalized)
    return {token for token in normalized.split() if len(token) >= 4}


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
        if part.lower() == "videos":
            for candidate in reversed(parts[index + 1:]):
                if re.fullmatch(r"\d+", candidate):
                    return candidate
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


def _looks_like_date_label(value: Any) -> bool:
    """Recognize the visible timestamp link used by Facebook feed cards."""
    label = _clean_line(str(value or "")).rstrip("·").strip()
    if not label:
        return False
    normalized = label.lower()
    return bool(
        _RELATIVE_DATE.fullmatch(normalized)
        or re.search(r"\b\d{1,2}\s+(?:de\s+)?[A-Za-záéíóú]+(?:\s+de)?\s+\d{4}\b", normalized)
        or re.search(r"\b[A-Za-z]+\s+\d{1,2},?\s+\d{4}\b", normalized)
        or re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b", normalized)
    )


def _html_attribute(attributes: str, name: str) -> str:
    match = re.search(rf"\b{name}\s*=\s*(['\"])(.*?)\1", attributes, flags=re.I | re.S)
    return html.unescape(match.group(2)) if match else ""


def _html_text(value: str) -> str:
    return _clean_line(html.unescape(re.sub(r"<[^>]+>", " ", value or "")))


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
        # Secret input can be wrapped by a shell or secret manager. Whitespace
        # is not part of the base64 payload and must not disable public capture.
        encoded = re.sub(r"\s+", "", encoded)
        try:
            decoded = base64.b64decode(encoded, validate=True)
            state = json.loads(decoded)
        except (binascii.Error, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            logger.warning("Ignoring invalid optional Facebook storage state: %s", type(exc).__name__)
            return None
        if not isinstance(state, dict) or not isinstance(state.get("cookies", []), list):
            logger.warning("Ignoring optional Facebook storage state with invalid shape")
            return None
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
            engagement = re.search(r"\b(?:like|me gusta)\s+(?:comment|comentar)\s+(?:share|compartir)\b", line, flags=re.I)
            if engagement:
                line = line[:engagement.start()].strip()
                if line:
                    content.append(line)
                break
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
            is_photo = re.search(r"/photo(?:/|$)", parsed.path, re.I) and bool(parse_qs(parsed.query).get("fbid"))
            if _CONTENT_PATH.search(parsed.path) and (identifier.lower() in parsed.path.lower() or is_reel or is_photo):
                canonical = _canonical_post_url(absolute)
                if canonical:
                    candidates.append(canonical)
        return candidates[0] if candidates else None

    @staticmethod
    def _page_permalink(page: Any, identifier: str) -> str | None:
        """Find the post permalink exposed by a public photo detail page."""
        try:
            links = page.locator("a")
            candidates: list[str] = []
            for index in range(min(links.count(), 160)):
                href = links.nth(index).get_attribute("href") or ""
                if not href or "comment_id=" in href:
                    continue
                absolute = urljoin("https://www.facebook.com/", href)
                parsed = urlsplit(absolute)
                if not _CONTENT_PATH.search(parsed.path):
                    continue
                if identifier.lower() not in parsed.path.lower() and not re.search(r"^/(?:photo|permalink\.php)(?:/|$)", parsed.path, re.I):
                    continue
                canonical = _canonical_post_url(absolute)
                if canonical and _post_id(canonical):
                    candidates.append(canonical)
            return candidates[0] if candidates else None
        except Exception:
            return None

    @staticmethod
    def _photo_candidates(page: Any, identifier: str) -> list[str]:
        """Collect only visible public post-photo links from the feed.

        Page cover/profile links are excluded. A photo is a discovery hint only;
        the detail page must independently expose text, date and a permalink.
        """
        try:
            items = page.locator("a[href*='/photo/']").evaluate_all(
                """nodes => nodes.map(node => ({
                    href: node.href || '',
                    insideArticle: Boolean(node.closest('[role=article]'))
                }))"""
            )
        except Exception:
            return []
        candidates: list[str] = []
        seen: set[str] = set()
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict):
                continue
            href = str(item.get("href") or "")
            absolute = urljoin("https://www.facebook.com/", href)
            parsed = urlsplit(absolute)
            query = parse_qs(parsed.query)
            if not query.get("fbid") or not parsed.path.lower().startswith("/photo"):
                continue
            album = str((query.get("set") or [""])[0])
            # `pb.` is the public page-photo collection. An article-local link
            # may use an album-shaped value, so retain it only in that scope.
            if album and not album.startswith("pb.") and not item.get("insideArticle"):
                continue
            canonical = _canonical_post_url(absolute)
            if canonical and canonical not in seen:
                # Keep the public album hint for navigation; canonical is
                # still used as the dedupe key and persisted post URL.
                navigation_query = {"fbid": query["fbid"][0]}
                if album:
                    navigation_query["set"] = album
                candidates.append(urlunsplit(("https", "www.facebook.com", "/photo/", urlencode(navigation_query), "")))
                seen.add(canonical)
        logger.info("source=%s public_photo_candidates=%d", identifier, len(candidates))
        return candidates

    @staticmethod
    def _video_candidates(page: Any, identifier: str) -> list[str]:
        """Collect public video/reel detail links exposed by the Page feed."""
        try:
            hrefs = page.locator("a").evaluate_all(
                """nodes => nodes.map(node => node.href || '').filter(Boolean)"""
            )
        except Exception:
            return []
        candidates: list[str] = []
        seen: set[str] = set()
        for href in hrefs if isinstance(hrefs, list) else []:
            absolute = urljoin("https://www.facebook.com/", str(href))
            parsed = urlsplit(absolute)
            if not parsed.netloc.lower().endswith("facebook.com"):
                continue
            is_video = bool(re.search(r"/videos/(?:[^/]+/)?\d+/?$", parsed.path, re.I))
            is_reel = bool(re.search(r"/reel/\d+/?$", parsed.path, re.I))
            if not (is_video or is_reel):
                continue
            canonical = _canonical_post_url(absolute)
            if canonical and _post_id(canonical) and canonical not in seen:
                candidates.append(canonical)
                seen.add(canonical)
        logger.info("source=%s public_video_candidates=%d", identifier, len(candidates))
        return candidates

    @staticmethod
    def _video_text(lines: list[str]) -> str:
        """Extract the visible caption from a public video detail page."""
        start = -1
        for index, line in enumerate(lines):
            if re.fullmatch(r"\d+:\d+\s*/\s*\d+:\d+", _clean_line(line)):
                start = index + 1
                break
        if start < 0:
            start = next((index for index, line in enumerate(lines) if "#" in line), 0)
        content: list[str] = []
        for raw_line in lines[start:]:
            line = _clean_line(raw_line)
            lowered = line.lower()
            if lowered.startswith(("like comment share", "me gusta comentar compartir")):
                break
            if re.search(r"(?:all\s+reactions|todas\s+las\s+reacciones|reacciones)", lowered):
                break
            if not line or line in {"Video", "More", "Home", "Live", "Reels", "Explore", "Seguir", "Follow", "See more"}:
                continue
            if re.fullmatch(r"\d+:\d+\s*/\s*\d+:\d+", line):
                continue
            line = re.sub(r"\s*(?:…|\.\.\.)?\s*See more\s*$", "", line, flags=re.I).strip()
            if line and line not in content:
                content.append(line)
        return "\n".join(content).strip()

    def _extract_video_page(self, page: Any, source: dict[str, Any], identifier: str, video_url: str) -> dict[str, Any] | None:
        """Parse text/date from a publicly visible video detail page."""
        try:
            self._expand_visible_text(page, page)
            body = page.locator("body")
            lines = [_clean_line(line) for line in body.inner_text(timeout=self.timeout * 1000).splitlines()]
            source_name = str(source.get("name") or "")
            source_index = next((index for index, line in enumerate(lines) if line == source_name), -1)
            date_label = None
            if source_index >= 0:
                date_label = next(
                    (line for line in lines[source_index + 1:source_index + 4] if _looks_like_date_label(line)),
                    None,
                )
            if not date_label:
                _, date_label = self._date_label(lines)
            permalink = self._page_permalink(page, identifier) or _canonical_post_url(page.url) or video_url
            if not permalink or not _post_id(permalink):
                logger.info("source=%s video_skip=no_permalink url=%s final_url=%s", source_name or "unknown", video_url, page.url)
                return None
            text = self._video_text(lines)
            if not text or not date_label:
                logger.info(
                    "source=%s video_skip=missing_fields date=%s text_len=%d lines=%d",
                    source_name or "unknown", bool(date_label), len(text), len(lines),
                )
                return None
            media = self._media(body)
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

    def _extract_photo_page(self, page: Any, source: dict[str, Any], identifier: str, photo_url: str) -> dict[str, Any] | None:
        """Parse a public photo detail page when the feed hides its article card."""
        try:
            self._expand_visible_text(page, page)
            body = page.locator("body")
            lines = [_clean_line(line) for line in body.inner_text(timeout=self.timeout * 1000).splitlines()]
            date_index, date_label = self._date_label(lines)
            permalink = self._page_permalink(page, identifier) or _canonical_post_url(page.url) or photo_url
            if not permalink or not _post_id(permalink):
                logger.info("source=%s photo_skip=no_permalink url=%s final_url=%s", source.get("name", "unknown"), photo_url, page.url)
                return None
            text = self._text_from_lines(lines, date_index, str(source.get("name") or ""))
            if not text or not date_label:
                logger.info(
                    "source=%s photo_skip=missing_fields date=%s date_index=%d text_len=%d lines=%d",
                    source.get("name", "unknown"),
                    bool(date_label),
                    date_index,
                    len(text),
                    len(lines),
                )
                return None
            media = self._media(body)
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

    @staticmethod
    def _dom_permalink(article: Any, identifier: str) -> str | None:
        """Recover a public post permalink from visible article metadata.

        Some Facebook layouts render the post text before exposing its anchor.
        Only post identifiers already attached to the public article are used;
        no identifier is guessed from the text or from a neighboring post.
        """
        selectors = "[data-ft], [data-pagelet], [data-id], [data-testid]"
        try:
            nodes = article.locator(selectors)
            values: list[str] = []
            for index in range(min(nodes.count(), 80)):
                node = nodes.nth(index)
                for name in ("data-ft", "data-pagelet", "data-id", "data-testid"):
                    value = node.get_attribute(name)
                    if value:
                        values.append(value)
        except Exception:
            values = []
        patterns = (
            r'"top_level_post_id"\s*:\s*"([^"\\]+)"',
            r'"post_id"\s*:\s*"([^"\\]+)"',
            r'"story_fbid"\s*:\s*"?([A-Za-z0-9_.-]+)',
            r'FeedUnit[_:-]([A-Za-z0-9_.-]+)',
        )
        try:
            markup = article.inner_html(timeout=2500)
            values.append(markup)
            for href in re.findall(r"(?:href|url)=[\"']([^\"']+)", markup, flags=re.I):
                candidate = _canonical_post_url(urljoin("https://www.facebook.com/", html.unescape(href)))
                if candidate and _post_id(candidate):
                    return candidate
        except Exception:
            pass
        for value in values:
            for pattern in patterns:
                match = re.search(pattern, value, re.I)
                if not match:
                    continue
                post_id = match.group(1).strip()
                if post_id and post_id not in {identifier, "0"}:
                    return _canonical_post_url(f"https://www.facebook.com/{identifier}/posts/{post_id}")
        return None

    @staticmethod
    def _photo_permalink_for_text(page: Any, identifier: str, source_name: str, article_text: str) -> str | None:
        """Associate a visible post image link with a feed card lacking anchors.

        Facebook's anonymous layout can render the post card without an
        ``<a>`` permalink while leaving the public photo link in a sibling
        wrapper. We require the source name and several matching caption words
        from the same visible DOM context before accepting that photo URL.
        """
        try:
            items = page.locator("a[href*='/photo/']").evaluate_all(
                """nodes => nodes.slice(0, 120).map(node => {
                    const contexts = [];
                    let current = node;
                    for (let depth = 0; current && depth < 12; depth += 1, current = current.parentElement) {
                        const text = (current.innerText || '').replace(/\\s+/g, ' ').trim();
                        if (text.length >= 60 && text.length <= 7000) contexts.push(text);
                    }
                    return { href: node.href || '', contexts };
                })"""
            )
        except Exception:
            return None
        source_tokens = _text_signature(source_name)
        article_tokens = _text_signature(article_text)
        if not article_tokens:
            return None
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict):
                continue
            candidate = _canonical_post_url(str(item.get("href") or ""))
            if not candidate or not _post_id(candidate):
                continue
            for context in item.get("contexts") if isinstance(item.get("contexts"), list) else []:
                context_text = str(context or "")
                context_tokens = _text_signature(context_text)
                overlap = len(article_tokens & context_tokens)
                source_match = bool(source_tokens and source_tokens.issubset(context_tokens))
                threshold = max(3, min(6, len(article_tokens) // 4 or 3))
                # Anonymous Facebook wrappers may omit the page name from
                # the nearest container. In that case require a stronger
                # caption match before accepting the visible photo URL.
                if (source_match and overlap >= threshold) or overlap >= max(5, threshold + 2):
                    logger.info("source=%s permalink_resolved_via_photo_context post_id=%s overlap=%d source_match=%s", identifier, _post_id(candidate), overlap, source_match)
                    return candidate
        return None

    def _timestamp_permalink(self, page: Any, article: Any, identifier: str) -> str | None:
        """Resolve a feed timestamp link without guessing a post identifier.

        Facebook sometimes renders a public feed card with a timestamp anchor
        that points back to the Page. Clicking that visible timestamp lets the
        public client resolve the real permalink. We use only the resulting
        Facebook URL and immediately return to the feed; no login, CAPTCHA or
        access-control interaction is attempted.
        """
        try:
            anchors = article.locator("a")
            fallback_anchor = None
            anchor_summary: list[dict[str, Any]] = []
            markup = article.inner_html(timeout=min(self.timeout * 1000, 2500))
            anchor_data = []
            for attributes, body in re.findall(r"<a\b([^>]*)>(.*?)</a\s*>", markup, flags=re.I | re.S)[:16]:
                anchor_data.append({
                    "href": _html_attribute(attributes, "href"),
                    "text": _html_text(body),
                    "aria": _html_attribute(attributes, "aria-label"),
                    "title": _html_attribute(attributes, "title"),
                    "tooltip": _html_attribute(attributes, "data-tooltip-content"),
                })
            for index, item in enumerate(anchor_data if isinstance(anchor_data, list) else []):
                if not isinstance(item, dict):
                    continue
                anchor = anchors.nth(index)
                href = str(item.get("href") or "")
                labels = [item.get("text"), item.get("aria"), item.get("title"), item.get("tooltip")]
                parsed_href = urlsplit(urljoin("https://www.facebook.com/", href))
                anchor_summary.append({
                    "path": parsed_href.path[:120],
                    "has_fragment": bool(parsed_href.fragment),
                    "labels": [_clean_line(label)[:80] for label in labels if _clean_line(label)][:3],
                })
                if not any(_looks_like_date_label(label) for label in labels):
                    if parsed_href.path.rstrip("/").lower() == f"/{identifier}".lower() and parsed_href.fragment:
                        fallback_anchor = anchor
                    continue
                fallback_anchor = anchor
                break
            if fallback_anchor is None:
                logger.info("source=%s timestamp_anchor_candidates=%s", identifier, json.dumps(anchor_summary, ensure_ascii=False))
                return None
            anchor = fallback_anchor
            try:
                initial_url = page.url
                anchor.click(timeout=min(self.timeout * 1000, 2500))
                page.wait_for_timeout(700)
                candidates = [_canonical_post_url(page.url)]
                links = page.locator("a")
                for link_index in range(min(links.count(), 160)):
                    href = links.nth(link_index).get_attribute("href") or ""
                    if href and "comment_id=" not in href:
                        candidates.append(_canonical_post_url(urljoin("https://www.facebook.com/", href)))
                for candidate in candidates:
                    if candidate and _post_id(candidate):
                        logger.info(
                            "source=%s permalink_resolved_via_timestamp=%s",
                            identifier,
                            candidate,
                        )
                        return candidate
            finally:
                if page.url != initial_url:
                    try:
                        page.go_back(wait_until="domcontentloaded", timeout=min(self.timeout * 1000, 5000))
                        page.wait_for_timeout(500)
                    except Exception:
                        page.goto(initial_url, wait_until="domcontentloaded", timeout=min(self.timeout * 1000, 5000))
                        page.wait_for_timeout(500)
        except Exception as exc:
            logger.debug("timestamp permalink resolution failed: %s", type(exc).__name__)
        return None

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

    @staticmethod
    def _expand_visible_text(target: Any, page: Any | None = None) -> bool:
        """Expand a public caption using Facebook's visible button only."""
        for label in ("See more", "Ver más"):
            try:
                # The current feed exposes this as a button. A text locator
                # may resolve a truncated ancestor and leave the caption
                # hidden, so prefer the semantic role.
                more = target.get_by_role("button", name=label, exact=True).first
                if more.count() and more.is_visible():
                    more.click(timeout=1500)
                    if page is not None:
                        page.wait_for_timeout(900)
                    return True
            except Exception:
                continue
        return False

    def _extract_article(self, article: Any, source: dict[str, Any], identifier: str, page: Any | None = None) -> dict[str, Any] | None:
        try:
            self._expand_visible_text(article, page)
            lines = [_clean_line(line) for line in article.inner_text(timeout=self.timeout * 1000).splitlines()]
            date_index, date_label = self._date_label(lines)
            text = self._text_from_lines(lines, date_index, str(source.get("name") or ""))
            permalink = self._permalink(article, identifier) or self._dom_permalink(article, identifier)
            if not permalink and page is not None:
                permalink = self._timestamp_permalink(page, article, identifier)
            if not permalink and page is not None:
                permalink = self._photo_permalink_for_text(page, identifier, str(source.get("name") or ""), text)
            if not permalink:
                logger.info(
                    "source=%s article_skip=no_permalink anchors=%d",
                    source.get("name", "unknown"),
                    article.locator("a").count(),
                )
                return None
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
        page_urls = [
            page_url,
            f"https://www.facebook.com/{identifier}/?sk=posts",
            f"https://m.facebook.com/{identifier}/",
            f"https://www.facebook.com/{identifier}/videos/",
        ]
        logger.info("opening source=%s url=%s", source.get("name", "unknown"), page_url)
        posts: list[dict[str, Any]] = []
        with sync_playwright() as playwright:
            headless_value = os.getenv("PLAYWRIGHT_HEADLESS", "1").strip().lower()
            headless = headless_value not in {"0", "false", "no"}
            browser = playwright.chromium.launch(headless=headless)
            context_kwargs: dict[str, Any] = {"locale": "en-US", "viewport": {"width": 1365, "height": 900}}
            if self.storage_state:
                context_kwargs["storage_state"] = self.storage_state
            context = browser.new_context(**context_kwargs)
            page = context.new_page()
            page.set_default_timeout(self.timeout * 1000)
            photo_candidates: list[str] = []
            video_candidates: list[str] = []
            try:
                for variant_index, candidate_url in enumerate(page_urls):
                    if len(posts) >= self.page_limit:
                        break
                    try:
                        page.goto(candidate_url, wait_until="domcontentloaded", timeout=self.timeout * 1000)
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
                        logger.info("source=%s variant=%d articles=%d", source.get("name", "unknown"), variant_index + 1, article_count)
                        for index in range(min(article_count, self.page_limit * 4)):
                            post = self._extract_article(articles.nth(index), source, identifier, page)
                            if post and post["post_url"] not in {item["post_url"] for item in posts}:
                                posts.append(post)
                            if len(posts) >= self.page_limit:
                                break
                        for photo_url in self._photo_candidates(page, identifier):
                            if photo_url not in photo_candidates:
                                photo_candidates.append(photo_url)
                        for video_url in self._video_candidates(page, identifier):
                            if video_url not in video_candidates:
                                video_candidates.append(video_url)
                    except PlaywrightTimeoutError:
                        logger.warning("source=%s variant=%d timeout", source.get("name", "unknown"), variant_index + 1)

                if len(posts) < self.page_limit and photo_candidates:
                    detail_page = context.new_page()
                    detail_page.set_default_timeout(self.timeout * 1000)
                    try:
                        max_photo_pages = min(len(photo_candidates), self.page_limit * 2)
                        for photo_url in photo_candidates[:max_photo_pages]:
                            if len(posts) >= self.page_limit:
                                break
                            try:
                                detail_page.goto(photo_url, wait_until="domcontentloaded", timeout=self.timeout * 1000)
                                detail_page.wait_for_timeout(1400)
                                if re.search(r"/login(?:/|$)", urlsplit(detail_page.url).path, re.I):
                                    logger.warning(
                                        "source=%s photo_detail_unavailable=login_redirect",
                                        source.get("name", "unknown"),
                                    )
                                    break
                                post = self._extract_photo_page(detail_page, source, identifier, photo_url)
                                if post and post["post_url"] not in {item["post_url"] for item in posts}:
                                    posts.append(post)
                                    logger.info("source=%s captured_via=photo_detail url=%s", source.get("name", "unknown"), post["post_url"])
                            except PlaywrightTimeoutError:
                                logger.warning("source=%s photo_detail_timeout url=%s", source.get("name", "unknown"), photo_url)
                    finally:
                        detail_page.close()

                if len(posts) < self.page_limit and video_candidates:
                    detail_page = context.new_page()
                    detail_page.set_default_timeout(self.timeout * 1000)
                    try:
                        max_video_pages = min(len(video_candidates), self.page_limit * 2)
                        for video_url in video_candidates[:max_video_pages]:
                            if len(posts) >= self.page_limit:
                                break
                            try:
                                detail_page.goto(video_url, wait_until="domcontentloaded", timeout=self.timeout * 1000)
                                detail_page.wait_for_timeout(1400)
                                if re.search(r"/login(?:/|$)", urlsplit(detail_page.url).path, re.I):
                                    logger.warning(
                                        "source=%s video_detail_unavailable=login_redirect",
                                        source.get("name", "unknown"),
                                    )
                                    break
                                post = self._extract_video_page(detail_page, source, identifier, video_url)
                                if post and post["post_url"] not in {item["post_url"] for item in posts}:
                                    posts.append(post)
                                    logger.info("source=%s captured_via=video_detail url=%s", source.get("name", "unknown"), post["post_url"])
                            except PlaywrightTimeoutError:
                                logger.warning("source=%s video_detail_timeout url=%s", source.get("name", "unknown"), video_url)
                    finally:
                        detail_page.close()
            finally:
                context.close()
                browser.close()
        if not posts:
            raise RuntimeError("No public Facebook posts parsed; page may require JS/session or have no readable posts")
        logger.info("source=%s posts=%d", source.get("name", "unknown"), len(posts))
        return posts
