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

El repositorio incluye `.github/workflows/ingest.yml` como workflow reutilizable y `.github/workflows/scheduled-ingest.yml` como entrada automática y manual. Instala Chromium para `PlaywrightFacebookSourceAdapter` y requiere los secretos `SULLANA_INGEST_URL` (por ejemplo, `https://<site>/api/ingest`) y `SULLANA_INGEST_TOKEN`. Antes de capturar, Actions consulta el endpoint protegido `/api/ingest-sources` para omitir fuentes pausadas desde el panel; si no está disponible, usa la configuración versionada como fallback. `FACEBOOK_STORAGE_STATE_B64` es opcional y debe contener únicamente un storage state autorizado; el runner no guarda SQLite ni credenciales en archivos. Si una fuente falla tras los reintentos, el Worker registra el error y la pausa para revisión; las demás continúan.

La periodicidad productiva usa un solo reloj: GitHub Actions dispara `scheduled-ingest.yml` con `*/30 * * * *` en UTC. El workflow es el runner de Playwright y conserva `workflow_dispatch` para pruebas manuales. El Worker `services/github-scheduler` permanece desplegado únicamente para salud y diagnóstico; su configuración productiva contiene `triggers.crons: []`, por lo que no genera una segunda captura ni duplica publicaciones. Si se reactiva otro scheduler, primero debe desactivarse este workflow o coordinarse una única clave de ejecución.

GitHub puede retrasar un evento `schedule` durante picos de carga. La verificación debe consultar el historial de Actions y `/api/health`; una corrida manual no sustituye la confirmación de un evento automático. `GITHUB_DISPATCH_TOKEN` y `SULLANA_INGEST_TOKEN` viven únicamente como secretos.
