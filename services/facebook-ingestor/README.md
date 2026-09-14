# Facebook ingestor

`PlaywrightFacebookSourceAdapter` is the only application module coupled to Facebook's browser surface. It is based on the public structure of [playwright-Facebook-scraper](https://github.com/Lencho123/playwright-Facebook-scraper), but normalizes directly into the existing ingestion contract.

Install dependency:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r services/facebook-ingestor/requirements.txt
python -m playwright install chromium
```

Run manually with public pages only:

```bash
printf '%s' '{"sources":[{"id":1,"name":"Fuente pública","facebook_url":"https://www.facebook.com/TurismoSullanaMPS/","facebook_identifier":"TurismoSullanaMPS"}]}' \
  | python3 services/facebook-ingestor/run.py
```

The adapter only accepts public Page URLs. It does not automate login, CAPTCHA, groups, private profiles or access-control bypasses. Empty results are observable errors; they are not converted into synthetic posts.

By default it runs without a session. If Facebook exposes the Page only after a user-authorized session, provide a Playwright `storage_state` JSON as a base64-encoded runner secret named `FACEBOOK_STORAGE_STATE_B64`; never commit `state.json`, email, password or cookies. The workflow passes that secret in memory and the adapter does not write it to the repository.

The configured eight public sources are checked conservatively (maximum eight posts per source, three scrolls, timeout, limited retries with exponential backoff and a 30-second interval). The normalized minimum is `text`, `published_at`, `source_url` and the canonical original `post_url`; optional engagement fields may be null. When Facebook exposes a post through a public `/photo/?fbid=...` permalink instead of `/posts/`, the adapter preserves that public URL and `fbid` for deduplication. `media` contains only public Facebook/CDN image/video references discovered in the visible article DOM, capped at six per post. The adapter does not download or republish them. `post_id`, URL and the existing D1 content hash provide deduplication downstream.
