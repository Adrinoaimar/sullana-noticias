# Scheduler

Para un MVP con SQLite, usa un proceso Node persistente y ejecuta el ingestor en el mismo volumen:

```cron
*/30 * * * * cd /srv/sullana-noticias && /usr/bin/npm run ingest >> /srv/sullana-noticias/data/ingest.log 2>&1
```

Controles incluidos:

- máximo configurable de páginas (`FACEBOOK_PAGE_LIMIT`, por defecto 3);
- timeout por fuente;
- reintentos configurables (`SCRAPER_RETRIES`) con backoff exponencial;
- intervalo mínimo entre fuentes (`SCRAPER_MIN_INTERVAL_SECONDS`);
- una fuente no detiene a las demás;
- deduplicación por `source_id + external_post_id` y `content_hash`;
- `scrape_runs` conserva resultado y errores;
- fuentes pausadas hasta ser verificadas.

GitHub Actions puede servir para CI o para llamar un worker externo, pero no debe ser la base de persistencia de SQLite: cada runner es efímero. Si se elige D1/PostgreSQL, sustituir la capa de `src/db.js` y conservar el contrato del adaptador.
