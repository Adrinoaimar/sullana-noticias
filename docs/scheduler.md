# Scheduler

Para un MVP con SQLite, usa un proceso Node persistente y ejecuta el ingestor en el mismo volumen:

```cron
*/30 * * * * cd /srv/sullana-noticias && /usr/bin/npm run ingest >> /srv/sullana-noticias/data/ingest.log 2>&1
```

Controles incluidos:

- máximo configurable de posts por fuente (`FACEBOOK_PAGE_LIMIT`, por defecto 8; el adapter limita a 10);
- timeout por fuente;
- reintentos configurables (`SCRAPER_RETRIES`) con backoff exponencial;
- intervalo mínimo entre fuentes (`SCRAPER_MIN_INTERVAL_SECONDS`);
- una fuente no detiene a las demás;
- deduplicación por `source_id + external_post_id` y `content_hash`;
- `scrape_runs` conserva resultado y errores;
- fuentes con error pausadas automáticamente hasta ser verificadas; el contenido sensible permanece en `VERIFY` para revisión editorial.
- el payload autorizado de GitHub Actions solicita publicación segura solo para borradores creados en las últimas 48 horas, de fuentes `TRUSTED_MEDIA`, categorías permitidas y clasificación `RELEVANT`; seguridad, asaltos, emergencias, presidencia y denuncias quedan fuera.

GitHub Actions puede servir para CI o para llamar un worker externo, pero no debe ser la base de persistencia de SQLite: cada runner es efímero. Si se elige D1/PostgreSQL, sustituir la capa de `src/db.js` y conservar el contrato del adaptador.

El repositorio incluye `.github/workflows/ingest.yml` para el Worker/D1. Instala Chromium para `PlaywrightFacebookSourceAdapter` y requiere los secretos `SULLANA_INGEST_URL` (por ejemplo, `https://<site>/api/ingest`) y `SULLANA_INGEST_TOKEN`. Antes de capturar, Actions consulta el endpoint protegido `/api/ingest-sources` para omitir fuentes pausadas desde el panel; si no está disponible, usa la configuración versionada como fallback. `FACEBOOK_STORAGE_STATE_B64` es opcional y debe contener únicamente un storage state autorizado; el runner no guarda SQLite ni credenciales en archivos. Si una fuente falla tras los reintentos, el Worker registra el error y la pausa para revisión; las demás continúan. El workflow productivo usa `*/30 * * * *`, aproximadamente cada 30 minutos; el disparador manual admite `publish_safe=false` para guardar un lote como borradores sin publicación masiva.
