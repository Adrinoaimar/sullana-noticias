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

## Decisión

`FacebookSourceAdapter` permanece como frontera estable. No se reconstruye todo el portal ni se intenta eludir controles de Facebook. La producción puede activar una fuente cuando el proveedor entregue posts públicos legibles o cuando se autorice una implementación compatible adicional para esa capa.

## Ruta oficial adicional

La investigación de producción confirmó que el Graph API de Meta no es una vía pública anónima: la lectura de posts de una Page requiere el acceso de la aplicación correspondiente (por ejemplo, Page Public Content Access/Metadata Access o permisos de Pages). Por eso se añadió una ruta opt-in dentro del mismo adapter:

- `META_PAGE_ACCESS_TOKEN` solo se lee desde el entorno secreto del scheduler.
- `META_GRAPH_API_VERSION` se fija en el workflow (`v26.0`) y no se obtiene dinámicamente.
- La respuesta se normaliza sin copiar campos no necesarios y los errores omiten la URL que contiene el token.
- Sin token, el comportamiento probado de `kevinzg/facebook-scraper` permanece intacto.

Fuentes técnicas revisadas: [referencia Page de Meta](https://developers.facebook.com/docs/graph-api/reference/page/) y [referencia histórica de Page Feed](https://developers.facebook.com/docs/graph-api/reference/page/feed/). La decisión de no evadir login/JavaScript también queda respaldada por los problemas upstream [#1130](https://github.com/kevinzg/facebook-scraper/issues/1130), [#1120](https://github.com/kevinzg/facebook-scraper/issues/1120) y [#1119](https://github.com/kevinzg/facebook-scraper/issues/1119).
