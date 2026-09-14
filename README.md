# Sullana Noticias

MVP editorial mobile-first para descubrir publicaciones públicas, convertir hallazgos en borradores revisables y publicar artículos locales con trazabilidad.

## Estado actual

- Web pública, panel editorial, SQLite persistente, RSS, sitemap, robots.txt, metadata OpenGraph y `NewsArticle`.
- Pipeline: fuente pública → ingesta → deduplicación → relevancia local → borrador → revisión → publicación.
- `PlaywrightFacebookSourceAdapter` encapsula la captura pública de Facebook; `kevinzg/facebook-scraper` queda como validación histórica, no como método principal.
- Autopublicación global desactivada. Posts sensibles quedan en `VERIFY`.
- Las fuentes institucionales de ejemplo permanecen pausadas hasta revisión editorial; las dos páginas de medios públicos incorporadas para esta fase se revisan como `TRUSTED_MEDIA` y sus hallazgos siempre exigen verificación.
- El fixture de demo no es una noticia real. Ejecutar `SEED_DEMO_ARTICLE=0 npm run seed` antes de un lanzamiento real.
- Analytics y slots de monetización están opt-in: sin IDs/configuración real permanecen inactivos.
- El Worker ESM de producción (`worker/index.js`) sirve la web y persiste en D1; el servidor Node/SQLite queda como referencia local.
- La ingesta Python se mantiene fuera del Worker y entrega payloads firmados a `/api/ingest`; sin posts públicos legibles el pipeline no fabrica borradores.

## Arranque local

Requiere Node.js 22.5+ por `node:sqlite`.

```bash
cp .env.example .env
ADMIN_PASSWORD='cambia-esta-clave' npm run seed
ADMIN_PASSWORD='cambia-esta-clave' npm start
```

Abrir `http://localhost:8787` y `/admin`. `ADMIN_PASSWORD` nunca va al repositorio.

Comandos:

```bash
npm run check
npm test
npm run seed
```

## Ingestor Facebook

Instalar dependencia del motor solicitado:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r services/facebook-ingestor/requirements.txt
```

El adaptador usa Playwright sobre páginas públicas, sin login automatizado, CAPTCHA, grupos privados ni evasión de controles. El servidor requiere que una fuente esté activa antes de revisarla. Cada fuente conserva `last_checked_at`, `last_success_at` y los errores de la ejecución. Si una página falla después de los reintentos, el Worker la pausa para revisión y continúa con las demás.

La prueba histórica de `kevinzg/facebook-scraper` queda documentada, pero la captura principal ahora es `PlaywrightFacebookSourceAdapter`, inspirada en [playwright-Facebook-scraper](https://github.com/Lencho123/playwright-Facebook-scraper). La configuración revisa siete páginas públicas de Sullana y captura hasta ocho posts visibles por fuente y ejecución. Conserva texto, fecha/etiqueta, fuente, URL canónica y metadatos de hasta seis fotos/videos públicos encontrados en el DOM; esos enlaces pueden caducar y no se descargan ni republican automáticamente.

### Ruta Meta Graph API (futuro)

`META_GRAPH = PENDING_EXTERNAL`. No es requisito del scheduler ni bloquea Playwright. Si se habilita en el futuro, deberá entrar como proveedor secundario y permanecer detrás de una autorización Meta válida.

Si Facebook exige una sesión para una fuente concreta, el workflow acepta opcionalmente `FACEBOOK_STORAGE_STATE_B64` como secreto de GitHub Actions. El storage state no se escribe en Git ni se genera mediante login automatizado.

## Flujo editorial

1. Panel: activar una fuente verificada.
2. `POST /api/admin/ingest` revisa fuentes activas.
3. `raw_posts` conserva texto, fecha, URL, hash e inventario de medios públicos (`media_json`); el panel permite abrir las referencias originales para revisión.
4. Relevancia detecta señales locales; contenido sensible exige `VERIFY`.
5. `auto_draft` crea borrador. Redacción inicial queda limitada al texto confirmado.
6. Editor corrige y confirma publicación explícitamente.
7. El artículo genera URL, canonical, OpenGraph, JSON-LD, sitemap y RSS.

## Endpoints útiles

```text
GET  /api/health
GET  /api/articles
GET  /api/articles/:slug
POST /api/events
POST /api/auth/login
GET  /api/admin/dashboard
GET  /api/admin/sources
POST /api/admin/ingest
GET  /api/admin/raw-posts
POST /api/admin/raw-posts/:id/draft
GET  /api/admin/drafts
PUT  /api/admin/drafts/:id
POST /api/admin/drafts/:id/publish
```

## Producción

Para el despliegue Worker/D1:

```bash
npm run site:validate
```

Configurar en Sites/Cloudflare los secretos `ADMIN_PASSWORD` e `INGEST_TOKEN`. El ingestor Python debe ejecutar `PlaywrightFacebookSourceAdapter` en un runner persistente/cron y enviar solo JSON normalizado a `POST /api/ingest` con `Authorization: Bearer ...`.

El servidor Node/SQLite local requiere además un proceso persistente y almacenamiento durable. Antes de usar cualquiera de los dos entornos:

1. Crear `ADMIN_PASSWORD` como secreto del proveedor.
2. Configurar `SITE_URL` con dominio real y `NODE_ENV=production`.
3. Montar `data/` como volumen persistente o migrar las consultas a D1/PostgreSQL.
4. Instalar `services/facebook-ingestor/requirements.txt` en worker Python.
5. Programar una ejecución cada 20–30 minutos con límite, timeout, rate limiting y backoff.
6. Activar solo fuentes revisadas; no activar `auto_publish`.
7. Configurar `GA4_MEASUREMENT_ID` con un ID real y validar consentimiento/privacidad.
   El panel ya muestra analytics first-party desde D1 (`article_view`, `category_view`, fuentes y compartidos); GA4 sigue siendo opcional.
8. Configurar `AD_NETWORK`/`AD_ZONE_ID`; el MVP solo reserva slots y no inyecta scripts de terceros inventados.
9. Configurar Adsterra/Monetag solo después de revisar sus términos vigentes y recibir su snippet/IDs.

No se declaran dominio, ingresos, analytics ni aprobación publicitaria sin credenciales o evidencia real.

## Privacidad y derechos

Las publicaciones de Facebook son señales de descubrimiento, no verdad absoluta. Las fotos y videos de terceros se conservan como referencias públicas para el editor; no se reutilizan ni se sirven en artículos sin autorización documentada. Conservar enlace original. No copiar literalmente. No inventar nombres, cifras, causas, responsables ni consecuencias.
