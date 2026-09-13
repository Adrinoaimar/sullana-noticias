# Sullana Noticias

MVP editorial mobile-first para descubrir publicaciones públicas, convertir hallazgos en borradores revisables y publicar artículos locales con trazabilidad.

## Estado actual

- Web pública, panel editorial, SQLite persistente, RSS, sitemap, robots.txt, metadata OpenGraph y `NewsArticle`.
- Pipeline: fuente pública → ingesta → deduplicación → relevancia local → borrador → revisión → publicación.
- `FacebookSourceAdapter` encapsula `kevinzg/facebook-scraper`.
- Autopublicación global desactivada. Posts sensibles quedan en `VERIFY`.
- Fuentes de ejemplo entran pausadas (`enabled = 0`) hasta revisión editorial.
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

El adaptador usa exclusivamente páginas públicas sin credenciales, cookies, grupos privados ni perfiles restringidos. El servidor requiere que una fuente esté activa antes de revisarla. Cada fuente conserva `last_checked_at`, `last_success_at` y los errores de la ejecución.

El proveedor upstream está fijado conceptualmente al repositorio `kevinzg/facebook-scraper`; la evaluación del 13/09/2026 encontró que la rama `master` instala tras añadir `lxml_html_clean`, pero no devuelve posts públicos legibles en tres páginas actuales probadas sin login. El sistema registra ese resultado como error observable y no fabrica posts.

### Ruta autorizada de Meta Graph API (opt-in)

Cuando Meta haya autorizado el acceso de la aplicación a las Pages objetivo, el scheduler puede usar la ruta oficial configurando el secreto `META_PAGE_ACCESS_TOKEN` en GitHub Actions. El adapter cambia a `/{page-id}/posts`, conserva solo `message`, `created_time`, `permalink_url` e imagen devueltos por Meta y nunca imprime el token. `META_GRAPH_API_VERSION` está fijada en `v26.0` en el workflow y puede cambiarse de forma explícita cuando Meta retire esa versión. Sin ese secreto, se mantiene la prueba pública de `facebook-scraper`; no hay fallback silencioso ni login.

La ruta requiere permisos o producto de Meta compatibles con lectura de contenido de Pages; una token ausente, inválida o sin acceso deja el run en `ERROR`. No se activa con un token inventado ni se sube ningún secreto al repositorio.

## Flujo editorial

1. Panel: activar una fuente verificada.
2. `POST /api/admin/ingest` revisa fuentes activas.
3. `raw_posts` conserva texto, fecha, URL, hash e imagen.
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

Configurar en Sites/Cloudflare los secretos `ADMIN_PASSWORD` e `INGEST_TOKEN`. El ingestor Python debe ejecutar `FacebookSourceAdapter` en un runner persistente/cron y enviar solo JSON normalizado a `POST /api/ingest` con `Authorization: Bearer ...`.

El servidor Node/SQLite local requiere además un proceso persistente y almacenamiento durable. Antes de usar cualquiera de los dos entornos:

1. Crear `ADMIN_PASSWORD` como secreto del proveedor.
2. Configurar `SITE_URL` con dominio real y `NODE_ENV=production`.
3. Montar `data/` como volumen persistente o migrar las consultas a D1/PostgreSQL.
4. Instalar `services/facebook-ingestor/requirements.txt` en worker Python.
5. Programar una ejecución cada 20–30 minutos con límite, timeout y backoff.
6. Activar solo fuentes revisadas; no activar `auto_publish`.
7. Configurar `GA4_MEASUREMENT_ID` con un ID real y validar consentimiento/privacidad.
8. Configurar `AD_NETWORK`/`AD_ZONE_ID`; el MVP solo reserva slots y no inyecta scripts de terceros inventados.
9. Configurar Adsterra/Monetag solo después de revisar sus términos vigentes y recibir su snippet/IDs.

No se declaran dominio, ingresos, analytics ni aprobación publicitaria sin credenciales o evidencia real.

## Privacidad y derechos

Las publicaciones de Facebook son señales de descubrimiento, no verdad absoluta. No reutilizar imágenes de terceros sin autorización. Conservar enlace original. No copiar literalmente. No inventar nombres, cifras, causas, responsables ni consecuencias.
