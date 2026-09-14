# Validación del motor Facebook

Fecha: 2026-09-13, `America/Lima`

## Repositorio solicitado

- Fuente: `https://github.com/kevinzg/facebook-scraper`
- Rama: `master`
- Commit consultado vía GitHub API: `567711fbab3e014504a1d4f33f882c2b29d71584`
- Licencia observada en GitHub: MIT
- README declara scraping de páginas públicas sin API key, pero advierte que Facebook puede bloquear la IP y que algunos campos dependen del acceso disponible.

## Instalación

El clonado Git directo quedó colgado durante la transferencia. Se preservó el intento, se descargó el tarball oficial de `codeload.github.com`, se instaló la fuente editable en un entorno aislado y se registró el fallback para no bloquear el proyecto.

La importación inicial falló por:

```text
ImportError: lxml.html.clean module is now a separate project lxml_html_clean.
```

Corrección de adaptación: instalar `lxml_html_clean`, sin editar el repositorio upstream.

## Pruebas upstream

Resultado ejecutado: `5 failed, 5 passed`.

- Dos fallos vienen de fixtures que usan `datetime.datetime` después de importar la clase `datetime`.
- Uno espera posts históricos de Nintendo y recibió cero elementos `<article>`.
- Uno exige `cookies.txt`, no disponible ni usado porque el MVP no accede con credenciales.
- Uno falla por fixture/grupo histórico.

## Prueba real sin login

Se revisaron tres páginas públicas:

- `TurismoSullanaMPS`
- `MunicipalidadBellavistaOficial`
- `munimarcavelica`

Cada llamada a `get_posts(..., page_limit=3, options={"allow_extra_requests": False})` terminó sin excepción, pero devolvió `0` posts legibles. El adapter lo convierte en `SCRAPER_ERROR` observable con mensaje de causa probable; no lo considera `SCRAPER_STATUS = WORKING`.

Reejecución integrada del 13/09/2026 (`npm run ingest`, tres fuentes activas, `page_limit=3`, `retries=1`, intervalo entre fuentes `0` solo para acelerar la prueba): `posts_found=0`, `new_posts=0`, `duplicates=0`, estado `ERROR`. Los tres errores quedaron persistidos en `scrape_runs`; en operación normal se conserva intervalo configurable y backoff exponencial.

## Decisión actual

`kevinzg/facebook-scraper` queda como validación histórica y no como método principal. La frontera estable ahora es `PlaywrightFacebookSourceAdapter`, que conserva el contrato existente (`text`, `published_at`, `source_url`, `post_url`, `post_id`) y deja intactos D1, deduplicación, clasificación, borradores, panel y publicación.

La prueba pública con Playwright y navegador sin sesión encontró artículos visibles en las tres fuentes iniciales:

- Turismo Sullana MPS: artículo visible con fecha absoluta y permalink de Page.
- Municipalidad Bellavista Oficial: artículo visible con etiqueta relativa `1d` y permalink de Page.
- Municipalidad Distrital de Marcavelica: artículo visible con etiqueta relativa `1d` y permalink de Page.

El adapter no automatiza login ni evade CAPTCHA, bloqueos o controles. Si una sesión autorizada fuera necesaria, solo acepta `FACEBOOK_STORAGE_STATE_B64` como secreto del runner. Meta Graph permanece `PENDING_EXTERNAL` y no bloquea Playwright. Referencia técnica: [playwright-Facebook-scraper](https://github.com/Lencho123/playwright-Facebook-scraper).

## Ampliación pública con medios — 2026-09-13

Se incorporaron [El Chilalo Noticias](https://www.facebook.com/ElChilaloNoticias/) y [Del Chira Noticias](https://www.facebook.com/delchiranoticias), manteniendo las fuentes institucionales existentes. El workflow de GitHub Actions ejecutó Chromium real y capturó un post visible de cada medio; el Worker respondió HTTP 200 y creó dos registros nuevos en D1. Una segunda corrida capturó cinco posts, obtuvo 20 referencias públicas de imágenes y ninguna URL de video visible en el DOM; los duplicados no se insertaron.

El adaptador conserva hasta ocho posts por fuente y hasta seis referencias de medios por post. `media_json` se guarda en `raw_posts`, `news_drafts` y `articles`; el panel permite abrir la referencia original. Cuando existe una imagen pública utilizable, el artículo la muestra con atribución; no se descarga ni se rehostea. El borrador editorial se parafrasea de forma conservadora a partir del texto completo visible y queda sujeto a revisión. Ignacio Escudero falló tres veces, quedó pausada y no impidió procesar las otras fuentes.

## Verificación El Churre y flujo editorial — 2026-09-14

La fuente [El Churre Noticias - Sullana](https://www.facebook.com/elchurrenoticiasoficialsullana) se añadió como medio público confiable. La primera corrida de GitHub Actions no obtuvo artículos legibles y la pausó después de tres intentos; la segunda corrida con Playwright sí capturó un post visible. El post quedó pendiente de persistencia mientras la fuente estaba pausada, por lo que la activación se mantiene manual desde el panel.

La corrección de clasificación permite que publicaciones de medios `TRUSTED_MEDIA` entren al borrador aunque el texto no mencione literalmente Sullana o Piura. En la segunda corrida se promovió a `DRAFT · VERIFY` un post real de El Chilalo con texto, fecha visible, fuente, URL original y una referencia pública de imagen. La portada mantiene solo el artículo publicado hasta que el editor revise y publique borradores; no se autopublican tragedias, acusaciones ni política.

La capa de enlaces también acepta permalinks públicos `/photo/?fbid=...` cuando Facebook no entrega `/posts/`; conserva el `fbid` y la URL canónica para evitar perder publicaciones visibles o duplicarlas.

La corrida `34804183174` terminó con GitHub Actions en estado `success`: Playwright encontró un post de El Churre y uno de Chilalo, el Worker respondió HTTP 200, D1 registró `posts_found=5`, `new_posts=1` y `media_images=24`, y quedó un error de fuente separado. El panel mostró 8 posts detectados, 3 borradores y 1 artículo publicado. El Churre sigue pausada hasta activación editorial.

## Contextos públicos y portada con varias noticias — 2026-09-14

El commit `28fc613` añadió `captured_via=photo_context`: cuando el DOM anónimo no expone `role=article`, Playwright toma únicamente el contexto visible compartido por la foto pública, exige texto, fecha y URL del mismo contexto, y conserva referencias públicas de imágenes. La corrida `34856961539` terminó `SUCCESS` con 14 posts reales, 4 nuevos, 51 imágenes y 0 errores; D1 respondió HTTP 200 y el flujo creó/publicó 4 candidatos seguros.

La versión 51 (`cc7aa33`) mantiene producción estable y actualiza una redacción generada solo si llega una captura más completa, sin sobreescribir ediciones manuales. El commit `993af19` excluye fotos de portada/perfil por sus etiquetas accesibles y deduplica en memoria por `post_id` o URL conservando la versión más completa. La corrida `34858224156` terminó `SUCCESS` con 12 posts reales de Chilalo/Churre, 2 nuevos, 50 imágenes, 0 errores y 2 publicaciones seguras. Smoke live confirmó health OK, 30 tarjetas públicas y 30 ítems RSS; Meta continúa `PENDING_EXTERNAL`.
