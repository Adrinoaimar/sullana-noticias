# Facebook ingestor

`FacebookSourceAdapter` is the only application module coupled to `kevinzg/facebook-scraper`.

Install dependency:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r services/facebook-ingestor/requirements.txt
```

Run manually with public pages only:

```bash
printf '%s' '{"sources":[{"id":1,"name":"Fuente pública","facebook_url":"https://www.facebook.com/TurismoSullanaMPS/","facebook_identifier":"TurismoSullanaMPS"}]}' \
  | python3 services/facebook-ingestor/run.py
```

The adapter never accepts groups, private profiles, cookies, credentials, or login flows. Empty results are observable errors; they are not converted into synthetic posts.
