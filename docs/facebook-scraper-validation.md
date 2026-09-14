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

## Ampliación a Piura y alrededores — 2026-09-14

Para ampliar cobertura sin convertir la fuente en un listado indiscriminado, se añadieron cuatro páginas públicas oficiales: [Municipalidad Provincial de Piura](https://www.facebook.com/MuniPiura/), [Gobierno Regional Piura](https://www.facebook.com/GobiernoRegionalPiura/), [Municipalidad Distrital de Castilla](https://www.facebook.com/muni.castilla.3/) y [Municipalidad Distrital de Veintiséis de Octubre](https://www.facebook.com/MunicipioVeintiseisDeOctubre/). Quedan clasificadas como `OFFICIAL` y activas; las publicaciones sensibles siguen en `VERIFY` y no se autopublican. La corrida completa del wrapper `34859532460` terminó `SUCCESS`; el health posterior registró 39 posts encontrados, 16 nuevos y 0 errores.

La corrida regional `34862673041` leyó 10 fuentes desde D1, capturó 55 posts públicos reales, 4 nuevos y 235 referencias de imágenes. El Worker respondió HTTP 200; publicó 2 borradores seguros y dejó 5 candidatos sensibles en `VERIFY`. Castilla no mostró publicaciones públicas en el navegador (`No hay publicaciones disponibles`), falló tras 3 intentos y quedó registrada para pausa; las demás fuentes continuaron. La corrida enfocada `34864167922` terminó `SUCCESS` con 11 posts, 59 imágenes y 0 errores.

El runner amplió el timeout de envío del lote de 30 a 180 segundos (`4425ec5`), porque la captura terminaba correctamente pero la creación de borradores/publicaciones regionales excedía la ventana corta. El adaptador evita reabrir variantes de video con el mismo `post_id` y corta captions al siguiente timestamp visible (`f79cd9a`), además de deduplicar representaciones con el mismo texto y fecha dentro de una fuente. El scheduler mantiene `*/30 * * * *`; `META_GRAPH=PENDING_EXTERNAL` sigue secundario.

Smoke live posterior: health `WEB=OK`, `D1=OK`, `PLAYWRIGHT_ADAPTER`, `META_GRAPH=PENDING_EXTERNAL`; portada 30 tarjetas, Actualidad 29 enlaces, RSS 30 ítems y sitemap 35 URLs de noticias.

## Captura activa y publicación actual — 2026-09-14

El Worker dejó de solicitar fuentes con `enabled=0`; una fuente que agota sus tres reintentos queda pausada con `SCRAPER_ERROR` y las demás continúan. La corrida `34866731668` terminó `SUCCESS` con 57 posts, 3 nuevos y 1 error aislado; la corrida `34868273618` terminó `SUCCESS` con 54 posts, 2 nuevos y el mismo error aislado de Castilla, que quedó pausada en D1. Ambas respuestas fueron HTTP 200 y conservaron la publicación segura sin autopublicar candidatos sensibles.

El siguiente artefacto público añade limpieza del mensaje de reproducción fallida de Facebook antes de formar captions. Se reconstruyó el artefacto para que el Worker desplegado use el código actual, manteniendo el mismo dominio, D1, autenticación, RSS, sitemap, panel y pipeline editorial. Smoke live confirmó 30 enlaces de noticias en portada, 30 ítems RSS, 41 URLs de noticias en sitemap y health `WEB=OK`, `D1=OK`, `PLAYWRIGHT_ADAPTER`, `META_GRAPH=PENDING_EXTERNAL`.

## Dedupe de representaciones y verificación visual — 2026-09-14

El commit `1e5722c` deduplica captions largos que Facebook expone con etiquetas relativas distintas (`6m`/`7m`) y conserva la captura más completa. La prueba unitaria del adaptador pasó con 3 casos; el artefacto mantiene limpieza de UI de reproducción y de imágenes no editoriales.

La corrida `34872991032` terminó `SUCCESS`: leyó 9 fuentes activas desde D1, capturó 7 posts públicos reales de Chilalo/Churre, 37 referencias de imagen y 0 errores; `new_posts=0` confirmó deduplicación en la repetición. Health posterior: `WEB=OK`, `D1=OK`, `PLAYWRIGHT_ADAPTER`, `META_GRAPH=PENDING_EXTERNAL`.

La portada en producción devuelve 30 tarjetas y 30 URLs únicas. En viewport móvil la grilla es de una columna y por eso se ve una tarjeta por pantalla; `Ver todo` muestra el archivo completo. No se modificaron D1, autenticación, RSS, sitemap ni el dominio público.

## Scheduler y secciones sensibles — 2026-09-14

El commit `9c4a44a` desplazó el cron del workflow principal a `17,47 * * * *` (aproximadamente cada 30 minutos) para evitar picos de carga de GitHub. La prueba `34876060345` sobre `main` terminó `SUCCESS` en 2m39s: 9 fuentes activas desde D1, 10 posts reales, 4 nuevos, 4 publicaciones seguras y 0 errores. Tras observar `:47`, no apareció un evento `schedule`; GitHub mantiene el workflow activo y el disparador manual sirve como respaldo.

La auditoría live de categorías encontró publicaciones públicas en Actualidad y Servicios. Presidencia, Asaltos, Seguridad y Emergencias permanecen sin artículos públicos porque sus borradores sensibles están en `VERIFY`; no se autopublican acusaciones, delitos, accidentes ni política. Los enlaces y categorías sí están creados.

## Contraste de fuente pública — 2026-09-14

CUA abrió [El Chilalo Noticias](https://www.facebook.com/ElChilaloNoticias) sin login ni controles de acceso: Facebook mostró publicaciones públicas con texto, imagen, hora y enlace original. El `fbid` público `1124807523215202` coincide con el log `captured_via=photo_context` de la corrida `34876060345`; el mismo workflow también capturó publicaciones públicas mediante `video_detail`. Esta evidencia conecta fuente visible, Playwright, normalización, D1 y publicación sin usar contenido inventado.

## Clasificación electoral — 2026-09-14

Se reforzó el clasificador para reconocer términos electorales como `encuestas`, `candidato`, `elección`, `votación`, `alcalde` y `gobernador`. Esas capturas ahora se envían a `politica-local` con estado `VERIFY`; una publicación política nacional continúa en `presidencia`. La prueba unitaria cubre ambos casos. No se alteraron artículos históricos ni la regla de publicación segura: el cambio evita que nuevas publicaciones políticas se autopubliquen como `Actualidad`.

La navegación pública ahora también enlaza `Política local`, manteniendo esa sección separada de `Actualidad` y protegida de la publicación masiva segura.

## Nueva verificación pública — 2026-09-14

La corrida `34880472749` terminó `SUCCESS`: leyó 9 fuentes activas desde D1, capturó 8 posts públicos reales de El Chilalo y El Churre, creó 2 nuevos, conservó 38 imágenes y registró 0 errores. CUA volvió a observar en Facebook contenido marcado como `Compartido con: Público`, incluido el post de El Chilalo con `fbid=1124869189875702` y la transmisión pública de El Churre sobre un incendio en Nueva Sullana. La captura se limita al texto, fecha y enlace visible; comentarios y reacciones no son necesarios para aceptar el post.

La corrida regional `34882098911` leyó 9 fuentes activas, encontró 51 posts públicos, creó 3 nuevos, conservó 270 imágenes y registró 0 errores. Para validar sin autopublicar mientras el Worker actualizado espera despliegue, el workflow añadió `publish_safe` como booleano manual; `34883444410` lo probó correctamente en `false`, con 8 posts, 0 nuevos, 0 errores y `safe_publication=null`.

La corrección `237b917` restauró el cron probado `*/30 * * * *` después de no observar nuevos eventos automáticos con `17,47 * * * *`; después, el commit actual desplaza el cron a `7,37 * * * *` para evitar `:00/:30`, según la recomendación de GitHub sobre cargas altas. Se conserva la concurrencia serializada y el wrapper manual de respaldo. El cambio no toca producción, D1, autenticación, RSS, sitemap ni el dominio público.

La corrida enfocada `34885105113` terminó `SUCCESS` sobre El Chilalo y El Churre: cargó 9 fuentes activas desde D1, capturó 9 posts públicos, creó 2 nuevos, conservó 42 imágenes y registró 0 errores. `publish_safe=false` dejó el lote como borrador; health posterior continuó en `WEB=OK`, `D1=OK`, `PLAYWRIGHT_ADAPTER` y `META_GRAPH=PENDING_EXTERNAL`.

La comprobación enfocada `34888714676` terminó `SUCCESS`: Playwright volvió a capturar 5 posts de El Chilalo y 4 de El Churre, D1 respondió HTTP 200, la deduplicación creó 0 nuevos registros, conservó 42 referencias públicas y registró 0 errores. `publish_safe=false` mantuvo la corrida en modo de revisión. Smoke HTTP y CUA confirman que la portada contiene 30 tarjetas; en móvil se muestra una por pantalla y `Ver todo` abre el listado completo.

El commit `e8efa71` hace que GitHub Actions ejecute Chromium headless, que mostró de forma más estable el feed público reciente de Facebook. La corrida `34889840151` terminó `SUCCESS`: capturó 5 posts de El Chilalo y 4 de El Churre, incluyendo un post reciente recuperado por `photo_context`; D1 respondió HTTP 200, creó 1 registro nuevo, conservó 43 referencias públicas y registró 0 errores. `publish_safe=false` dejó el nuevo hallazgo como borrador para revisión. Health siguió en `WEB=OK`, `D1=OK`, `PLAYWRIGHT_ADAPTER` y `META_GRAPH=PENDING_EXTERNAL`.

La corrida `34890543939` probó el tramo final con `publish_safe=true`: capturó 9 posts públicos, D1 respondió HTTP 200 y no hubo errores; el paso de publicación segura evaluó 10 borradores, publicó 2 y dejó 8 en revisión. La nueva nota real de El Chilalo aparece como primera tarjeta pública. Smoke live confirmó 30 tarjetas, 30 ítems RSS, 50 URLs de noticias en sitemap y health OK.
