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
