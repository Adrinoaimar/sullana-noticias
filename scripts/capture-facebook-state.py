#!/usr/bin/env python3
"""Create an authorized Playwright storage state without writing it to disk."""

from __future__ import annotations

import base64
import json
import sys

from playwright.sync_api import sync_playwright


def main() -> int:
    print("Se abrirá Facebook. Inicia sesión manualmente y vuelve aquí.", file=sys.stderr)
    print("Pulsa Enter solo después de que Facebook esté listo; no se guardará tu contraseña.", file=sys.stderr)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1365, "height": 900})
        page = context.new_page()
        page.goto("https://www.facebook.com/", wait_until="domcontentloaded", timeout=60_000)
        input()
        state = context.storage_state()
        encoded = base64.b64encode(json.dumps(state, ensure_ascii=False).encode()).decode()
        browser.close()
    sys.stdout.write(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
