const enc = new TextEncoder();

const STYLE = `
:root{--ink:#18312d;--muted:#6a7771;--paper:#f7f5ef;--tint:#e6eee8;--line:#d7dfd8;--accent:#e86f42;--dark:#18312d;--white:#fffefa;font-family:system-ui,-apple-system,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);line-height:1.55}a{color:inherit;text-decoration:none}a:hover{color:var(--accent)}.shell{width:min(1120px,calc(100% - 40px));margin:auto}.skip{position:absolute;left:-999px}.skip:focus{left:10px;top:10px;background:var(--dark);color:#fff;padding:10px}.header{border-bottom:1px solid var(--line)}.header-row{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:22px}.brand{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.02}.brand strong,h1,h2,h3{font-family:Georgia,serif}.brand strong{font-size:23px}.mark{display:grid;place-items:center;width:38px;height:38px;border-radius:13px 13px 13px 3px;background:var(--accent);color:#fff;font-size:12px;font-weight:700}.nav{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;font-weight:700;color:#52605a}.hero{padding:90px 0 72px}.kicker{color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.hero h1{font-size:clamp(54px,10vw,116px);line-height:1;letter-spacing:-.06em;max-width:760px;margin:18px 0 0}.hero h1 em{color:var(--accent);font-style:normal}.lede{max-width:490px;color:var(--muted);font-size:18px}.meta{color:#78847e;font-size:12px;margin-top:35px}.section{padding:44px 0 72px}.heading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:26px}.heading h2{font-size:42px;line-height:1;margin:8px 0 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{padding:22px;border:1px solid var(--line);background:#fffefa66}.card h3{font-size:28px;line-height:1.05;margin:12px 0}.card p{color:var(--muted);font-size:14px}.eyebrow{color:#76817b;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.button{display:inline-flex;min-height:42px;align-items:center;justify-content:center;padding:0 16px;border:1px solid var(--dark);background:transparent;color:var(--ink);font-weight:700;cursor:pointer}.button.dark{background:var(--dark);color:#fff}.empty{padding:36px;border:1px dashed #b6c2b9;color:var(--muted)}.empty strong{display:block;margin-bottom:8px;color:var(--ink);font:600 27px Georgia,serif}.tint{background:var(--tint);padding-left:max(20px,calc((100vw - 1120px)/2));padding-right:max(20px,calc((100vw - 1120px)/2))}.principles{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.principles h3{font-size:28px;margin:12px 0 8px}.principles p{max-width:280px;color:var(--muted);font-size:14px}.article{padding:70px 0 100px}.article h1{font-size:clamp(48px,7vw,92px);line-height:1;letter-spacing:-.06em;max-width:920px;margin:12px 0 24px}.dek{max-width:720px;color:var(--muted);font-size:20px}.source{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0;color:#69756f;font-size:12px}.source a{color:var(--accent);font-weight:700}.body{max-width:720px;margin:45px 0;font:24px/1.58 Georgia,serif}.share{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:12px}.share button{padding:8px 12px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}.footer{padding:52px 0;background:var(--dark);color:#d3dfd7;font-size:13px}.footer p{color:#aebdb4}.ad{width:min(1120px,calc(100% - 40px));min-height:48px;margin:20px auto;display:flex;align-items:center;justify-content:center;gap:10px;border:1px dashed #c7d0c9;color:#85918a;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.admin{padding:60px 0 100px}.admin-card{padding:24px;border:1px solid var(--line);margin:18px 0;background:#fffefa66}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{padding:18px;background:var(--dark);color:#fff}.metric small{display:block;color:#aebdb4;text-transform:uppercase;font-size:10px}.metric strong{display:block;font:600 38px Georgia,serif;margin-top:8px}.item{border-top:1px solid var(--line);padding:14px 0}.item:first-child{border-top:0}.item p{color:var(--muted);font-size:13px}.badge{padding:4px 7px;background:#dfe9e1;color:#36584b;font-size:10px;font-weight:800}.warn{background:#ffe6dc;color:#9b4629}label{display:block;color:var(--muted);font-size:12px;font-weight:700;margin:12px 0}input,textarea,select{display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--line);background:#fffefa;font:14px system-ui}textarea{min-height:120px}.hidden{display:none}.ad small{color:#a2ada6}@media(max-width:760px){.shell{width:calc(100% - 28px)}.header-row{align-items:flex-start;flex-direction:column;padding:16px 0}.nav{gap:10px 15px}.hero{padding:65px 0 50px}.grid,.principles,.metrics{grid-template-columns:1fr}.heading{align-items:flex-start;flex-direction:column}.heading h2{font-size:36px}.article{padding:50px 0 75px}.body{font-size:21px}.tint{padding-left:14px;padding-right:14px}}
`;

const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const html = (value, status = 200, headers = {}) => new Response(value, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const text = (value, type = 'text/plain; charset=utf-8', status = 200, headers = {}) => new Response(value, { status, headers: { 'content-type': type, ...headers } });
const now = () => new Date().toISOString();
const originOf = (request) => new URL(request.url).origin;
const dbRows = async (db, sql, ...values) => (await db.prepare(sql).bind(...values).all()).results || [];
const dbFirst = async (db, sql, ...values) => (await db.prepare(sql).bind(...values).first()) || null;
const dbRun = async (db, sql, ...values) => db.prepare(sql).bind(...values).run();
const bodyJson = async (request) => { try { return await request.json(); } catch { return {}; } };

function classify(value) {
  const text = String(value || '').toLowerCase();
  const local = ['sullana', 'bellavista', 'marcavelica', 'querecotillo', 'lancones', 'miguel checa', 'salitral', 'piura', 'mallares'].some((term) => text.includes(term));
  const sensitive = ['accidente', 'delito', 'fallec', 'denuncia', 'emergencia', 'acusaci', 'asesin', 'muerte', 'politica', 'política'].some((term) => text.includes(term));
  return { status: local ? (sensitive ? 'VERIFY' : 'RELEVANT') : 'NOT_RELEVANT', verification: sensitive ? 'VERIFY' : 'UNVERIFIED' };
}

function titleFrom(value) {
  const title = String(value || '').replace(/\s+/g, ' ').trim().split(/[.!?]\s/)[0] || 'Nueva publicación local';
  return title.length > 100 ? `${title.slice(0, 97)}…` : title;
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', enc.encode(String(value)));
  return [...new Uint8Array(bytes)].slice(0, 12).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret || 'disabled'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
}

function sameBytes(a, b) { return a.length === b.length && a.every((value, index) => value === b[index]); }

async function signedCookie(value, secret) {
  const signature = btoa(String.fromCharCode(...await hmac(value, secret))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `${value}.${signature}`;
}

async function adminCookie(env) { return signedCookie(`${Date.now() + 8 * 60 * 60 * 1000}`, env.ADMIN_PASSWORD); }

async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const cookie = request.headers.get('cookie') || '';
  const value = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('sullana_session='))?.slice('sullana_session='.length);
  if (!value) return false;
  const [expires, signature] = value.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = await signedCookie(expires, env.ADMIN_PASSWORD);
  return sameBytes(enc.encode(`${expires}.${signature}`), enc.encode(expected));
}

async function authorizedIngest(request, env) {
  const configured = String(env.INGEST_TOKEN || '');
  const supplied = String(request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!configured || !supplied) return false;
  return sameBytes(await hmac(supplied, configured), await hmac(configured, configured));
}

async function seed(db) {
  const categories = [['Actualidad', 'actualidad'], ['Seguridad', 'seguridad'], ['Servicios', 'servicios'], ['Política local', 'politica-local'], ['Educación', 'educacion'], ['Deportes', 'deportes'], ['Eventos', 'eventos'], ['Economía', 'economia'], ['Empleo', 'empleo'], ['Comunidad', 'comunidad'], ['Emergencias', 'emergencias'], ['Entretenimiento', 'entretenimiento']];
  for (const category of categories) await dbRun(db, 'INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)', ...category);
  const sources = [
    ['Turismo Sullana MPS', 'https://www.facebook.com/TurismoSullanaMPS/', 'TurismoSullanaMPS'],
    ['Municipalidad Bellavista Oficial', 'https://www.facebook.com/MunicipalidadBellavistaOficial', 'MunicipalidadBellavistaOficial'],
    ['Municipalidad Distrital de Marcavelica', 'https://www.facebook.com/munimarcavelica', 'munimarcavelica'],
    ['Municipalidad Distrital de Querecotillo', 'https://www.facebook.com/MuniQuerecotillo', 'MuniQuerecotillo'],
    ['Municipalidad Distrital de Ignacio Escudero', 'https://www.facebook.com/m.d.ignacio.escudero', 'm.d.ignacio.escudero'],
  ];
  for (const source of sources) await dbRun(db, 'INSERT OR IGNORE INTO sources (name, facebook_url, facebook_identifier, trust_level, enabled, auto_draft, auto_publish) VALUES (?, ?, ?, ?, 0, 1, 0)', source[0], source[1], source[2], 'OFFICIAL');
}

function adSlot(env, position) {
  const network = String(env.AD_NETWORK || '').toLowerCase();
  if (!network || network === 'none') return '';
  return `<aside class="ad" data-ad-network="${esc(network)}" aria-label="Espacio publicitario"><span>Publicidad</span><small>${esc(position)}</small></aside>`;
}

function layout(env, request, title, description, body, extra = '') {
  const origin = originOf(request);
  const ga = String(env.GA4_MEASUREMENT_ID || '').replace(/[^A-Za-z0-9_-]/g, '');
  const analytics = ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});</script>` : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(origin)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Sullana Noticias"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin)}"><meta name="twitter:card" content="summary"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%23e86f42'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-family='Arial' font-size='22' font-weight='700' fill='white'%3ESN%3C/text%3E%3C/svg%3E"><style>${STYLE}</style>${analytics}${extra}</head><body><a class="skip" href="#contenido">Saltar al contenido</a><header class="header"><div class="shell header-row"><a class="brand" href="/"><span class="mark">SN</span><span>Sullana<br><strong>Noticias</strong></span></a><nav class="nav" aria-label="Navegación"><a href="/">Inicio</a><a href="/categoria/actualidad">Actualidad</a><a href="/categoria/servicios">Servicios</a><a href="/categoria/seguridad">Seguridad</a><a href="/admin">Panel</a></nav></div></header>${adSlot(env, 'header')}<main id="contenido">${body}</main><footer class="footer"><div class="shell"><strong>Sullana Noticias</strong><p>Información local, fuentes identificables y revisión humana.</p><a href="/rss.xml">RSS</a> · <a href="/sitemap.xml">Mapa del sitio</a></div></footer><script>${CLIENT_JS}</script></body></html>`;
}

const CLIENT_JS = `(()=>{const send=(name,metadata={})=>{if(typeof window.gtag==='function')window.gtag('event',name,metadata);fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:name,metadata})}).catch(()=>{})};document.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click',async()=>{const u=b.dataset.url,t=b.dataset.title||document.title;const n=b.dataset.share==='copy'?'copy_link':b.dataset.share+'_share';send(n,{path:location.pathname});if(b.dataset.share==='copy'){await navigator.clipboard?.writeText(u);b.textContent='Enlace copiado';setTimeout(()=>b.textContent='Copiar enlace',1800)}else if(b.dataset.share==='whatsapp')window.open('https://wa.me/?text='+encodeURIComponent(t+' '+u),'_blank','noopener');else window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u),'_blank','noopener'))}));})();`;

async function articleRows(env, limit = 30) {
  if (!env.DB) return [];
  return dbRows(env.DB, 'SELECT a.*, c.name AS category_name, c.slug AS category_slug FROM articles a LEFT JOIN categories c ON c.id=a.category_id ORDER BY a.published_at DESC LIMIT ?', Math.min(Math.max(Number(limit) || 30, 1), 100));
}

function card(article) { return `<article class="card"><div class="eyebrow">${esc(article.category_name || 'Actualidad')} · ${esc(article.published_at || 'Sin fecha')}</div><h3><a href="/noticias/${encodeURIComponent(article.slug)}">${esc(article.title)}</a></h3><p>${esc(article.dek || article.summary || '')}</p><a class="button" href="/noticias/${encodeURIComponent(article.slug)}">Leer noticia ↗</a></article>`; }

async function home(env, request) {
  const articles = await articleRows(env);
  const body = `<section class="hero shell"><div class="kicker">Noticias locales · Sullana, Piura</div><h1>Lo que pasa cerca,<br><em>bien contado.</em></h1><p class="lede">Un medio local independiente para seguir servicios, comunidad y actualidad de la provincia.</p><p class="meta">Fuentes públicas + revisión editorial</p></section>${adSlot(env, 'home-top')}<section class="shell section"><div class="heading"><div><div class="kicker">01 / Ahora</div><h2>Últimas noticias</h2></div><a href="/categoria/actualidad">Ver todo ↗</a></div>${articles.length ? `<div class="grid">${articles.map(card).join('')}</div>` : '<div class="empty"><strong>El primer despacho está por llegar.</strong><p>Las fuentes públicas se procesan y cada hallazgo pasa por revisión editorial antes de publicarse.</p></div>'}</section><section class="tint"><div class="shell section"><div class="heading"><div><div class="kicker">02 / Criterio</div><h2>Cómo trabajamos</h2></div></div><div class="principles"><div><div class="kicker">01</div><h3>Fuente identificable</h3><p>Cada nota conserva enlace y fecha de la publicación original.</p></div><div><div class="kicker">02</div><h3>Redacción propia</h3><p>No copiamos textos ni inventamos datos.</p></div><div><div class="kicker">03</div><h3>Revisión humana</h3><p>Accidentes, denuncias y emergencias no se autopublican.</p></div></div></div></section>`;
  return html(layout(env, request, 'Sullana Noticias · Actualidad local', 'Noticias locales de Sullana, Piura: actualidad, servicios, comunidad y agenda.', body));
}

async function category(env, request, slug) {
  const category = env.DB ? await dbFirst(env.DB, 'SELECT * FROM categories WHERE slug=?', slug) : null;
  const articles = category ? (await articleRows(env, 100)).filter((article) => article.category_slug === slug) : [];
  const title = category?.name || 'Actualidad';
  const body = `<section class="shell section"><div class="kicker">Archivo local</div><h1>${esc(title)}</h1><p class="lede">Noticias y publicaciones editoriales de ${esc(title.toLowerCase())} en Sullana y la provincia.</p></section><section class="shell section"><div class="grid">${articles.length ? articles.map(card).join('') : '<div class="empty"><strong>Aún no hay publicaciones.</strong><p>Los artículos aprobados aparecerán aquí.</p></div>'}</div></section>`;
  return html(layout(env, request, `${title} · Sullana Noticias`, `Noticias de ${title.toLowerCase()} en Sullana, Piura.`, body));
}

async function article(env, request, slug) {
  const item = env.DB ? await dbFirst(env.DB, 'SELECT a.*, c.name AS category_name FROM articles a LEFT JOIN categories c ON c.id=a.category_id WHERE a.slug=?', slug) : null;
  if (!item) return html(layout(env, request, 'Noticia no encontrada', 'La noticia solicitada no está disponible.', '<section class="shell section"><h1>Noticia no encontrada</h1><p>Puede haber sido retirada o aún está en revisión.</p><a class="button dark" href="/">Volver al inicio</a></section>'), 404);
  const canonical = `${originOf(request)}/noticias/${encodeURIComponent(item.slug)}`;
  const extra = `<link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(item.title)}"><meta property="og:description" content="${esc(item.meta_description || item.dek)}"><meta property="og:url" content="${esc(canonical)}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:item.title,description:item.meta_description||item.dek,datePublished:item.published_at,dateModified:item.modified_at,mainEntityOfPage:canonical,author:{'@type':'Organization',name:'Sullana Noticias'},publisher:{'@type':'Organization',name:'Sullana Noticias'}})}</script>`;
  const body = `<article class="shell article"><div class="eyebrow">${esc(item.category_name || 'Actualidad')} · ${esc(item.published_at || '')}</div><h1>${esc(item.title)}</h1><p class="dek">${esc(item.dek || item.summary)}</p><div class="source">Fuente: <a href="${esc(item.source_url)}" rel="nofollow noopener" target="_blank">${esc(item.source_name)}</a> · <a href="${esc(item.original_post_url)}" rel="nofollow noopener" target="_blank">publicación original</a></div>${adSlot(env, 'article-body')}<div class="body">${esc(item.body || item.summary).replaceAll('\n','<br>')}</div><div class="share"><strong>Compartir</strong><button data-share="whatsapp" data-url="${esc(canonical)}" data-title="${esc(item.title)}">WhatsApp</button><button data-share="facebook" data-url="${esc(canonical)}">Facebook</button><button data-share="copy" data-url="${esc(canonical)}">Copiar enlace</button></div></article>`;
  if (env.DB) await dbRun(env.DB, 'UPDATE articles SET view_count=view_count+1 WHERE id=?', item.id);
  return html(layout(env, request, item.meta_title || `${item.title} · Sullana Noticias`, item.meta_description || item.dek, body, extra));
}

async function dashboard(env) {
  if (!env.DB) return { database: 'MISSING' };
  const count = async (table, where = '') => (await dbFirst(env.DB, `SELECT COUNT(*) AS total FROM ${table} ${where}`))?.total || 0;
  return { visits_today: await count('events', "WHERE event_name='article_view' AND date(created_at)=date('now')"), articles_today: await count('articles', "WHERE date(published_at)=date('now')"), sources_enabled: await count('sources', 'WHERE enabled=1'), posts_detected: await count('raw_posts'), drafts: await count('news_drafts', "WHERE editorial_status='DRAFT'"), published: await count('articles'), last_scrape: await dbFirst(env.DB, 'SELECT * FROM scrape_runs ORDER BY started_at DESC LIMIT 1') };
}

async function createDraft(db, raw) {
  const source = await dbFirst(db, 'SELECT * FROM sources WHERE id=?', raw.source_id);
  const category = await dbFirst(db, "SELECT * FROM categories WHERE slug='actualidad'");
  if (!source || !category) throw new Error('SOURCE_OR_CATEGORY_NOT_FOUND');
  const check = classify(raw.text);
  const title = titleFrom(raw.text);
  let slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'noticia-local';
  if (await dbFirst(db, 'SELECT id FROM news_drafts WHERE slug=? UNION SELECT id FROM articles WHERE slug=?', slug, slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const verification = check.sensitive || source.trust_level !== 'OFFICIAL' ? 'VERIFY' : 'UNVERIFIED';
  const result = await dbRun(db, 'INSERT INTO news_drafts (raw_post_id,category_id,title,dek,summary,body,keywords,meta_title,meta_description,slug,source_name,source_url,original_post_url,original_published_at,image_type,image_url,verification_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', raw.id, category.id, title, 'Borrador pendiente de revisión editorial.', raw.text, raw.text, 'Sullana, Piura, actualidad local', title, raw.text.slice(0, 155), slug, source.name, source.facebook_url, raw.post_url, raw.published_at || null, raw.image_url ? 'SOURCE_IMAGE' : 'NO_IMAGE', raw.image_url || null, verification);
  await dbRun(db, 'UPDATE raw_posts SET processing_status=?,verification_status=? WHERE id=?', 'DRAFTED', verification, raw.id);
  return { id: result.meta?.last_row_id, verification_status: verification };
}

async function persistIngest(env, payload) {
  const db = env.DB;
  if (!db) return { status: 'ERROR', error: 'DATABASE_NOT_CONFIGURED' };
  const sources = await dbRows(db, 'SELECT * FROM sources WHERE enabled=1 ORDER BY id');
  const runId = crypto.randomUUID();
  const started = now();
  const run = await dbRun(db, 'INSERT INTO scrape_runs (run_id,started_at,sources_checked,status) VALUES (?,?,?,?)', runId, started, sources.length, 'RUNNING');
  const insert = 'INSERT OR IGNORE INTO raw_posts (source_id,external_post_id,text,post_url,image_url,published_at,fetched_at,content_hash,processing_status,verification_status,likes,comments,shares,reactions_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  const adapterErrors = Array.isArray(payload.errors) ? payload.errors : [];
  const failedSourceIds = new Set(adapterErrors.map((error) => Number(error.source_id)).filter(Number.isInteger));
  const failedSourceNames = new Set(adapterErrors.map((error) => String(error.source || '').trim()).filter(Boolean));
  let found = 0, fresh = 0, duplicates = 0, errors = adapterErrors.map((error) => `${error.source || 'adapter'}: ${error.message || 'SCRAPER_ERROR'}`);
  for (const post of Array.isArray(payload.posts) ? payload.posts : []) {
    const source = sources.find((item) => item.id === Number(post.source_id) || item.facebook_identifier === post.page_identifier || item.facebook_url === post.source_url);
    if (!source || !post.post_url) continue;
    found += 1;
    const check = classify(post.text);
    const hash = await digest(`${post.text || ''}\n${post.post_url}`);
    const result = await dbRun(db, insert, source.id, post.post_id || null, post.text || '', post.post_url, post.image || null, post.published_at || null, now(), hash, check.status, check.verification, post.likes ?? null, post.comments ?? null, post.shares ?? null, JSON.stringify(post.reactions || null));
    if (!result.meta?.changes) { duplicates += 1; continue; }
    fresh += 1;
    if (source.auto_draft && check.status !== 'NOT_RELEVANT') {
      try { const raw = await dbFirst(db, 'SELECT * FROM raw_posts WHERE content_hash=?', hash); await createDraft(db, raw); } catch (error) { errors.push(`${source.name}: ${error.message}`); }
    }
  }
  const status = errors.length && !found ? 'ERROR' : errors.length ? 'PARTIAL' : 'SUCCESS';
  await dbRun(db, 'UPDATE scrape_runs SET finished_at=?,posts_found=?,new_posts=?,duplicates=?,errors=?,status=?,error_message=? WHERE id=?', now(), found, fresh, duplicates, errors.length, status, errors.join(' | ') || null, run.meta?.last_row_id);
  for (const source of sources) {
    const failed = failedSourceIds.has(Number(source.id)) || failedSourceNames.has(String(source.name));
    await dbRun(db, "UPDATE sources SET enabled=CASE WHEN ? THEN 0 ELSE enabled END, last_checked_at=?, last_success_at=CASE WHEN ? IN ('SUCCESS','PARTIAL') AND ?=0 THEN ? ELSE last_success_at END WHERE id=?", failed ? 1 : 0, now(), status, failed ? 1 : 0, now(), source.id);
  }
  return { run_id: runId, status, posts_found: found, new_posts: fresh, duplicates, errors };
}

async function adminPage(env, request) {
  const body = `<section class="shell admin"><div class="kicker">Operaciones</div><h1>Panel editorial</h1><p class="lede">Detecta, verifica, redacta y publica con trazabilidad.</p><div id="login" class="admin-card"><h2>Acceso editorial</h2><form id="login-form"><label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label><button class="button dark">Entrar</button><p id="error"></p></form></div><div id="app" class="hidden"><div id="metrics" class="metrics"></div><div class="admin-card"><h2>Fuentes</h2><div id="sources"></div><button id="ingest" class="button">Revisar ahora</button></div><div class="admin-card"><h2>Posts detectados</h2><div id="raw"></div></div><div class="admin-card"><h2>Borradores</h2><div id="drafts"></div></div></div></section>`;
  const script = String.raw`<script>(()=>{const q=s=>document.querySelector(s),esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"),api=async(p,o={})=>{const r=await fetch(p,{headers:{"content-type":"application/json",...(o.headers||{})},...o}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||d.error||"REQUEST_FAILED");return d};async function load(){const[d,s,r,w]=await Promise.all([api("/api/admin/dashboard"),api("/api/admin/sources"),api("/api/admin/raw-posts"),api("/api/admin/drafts")]);q("#metrics").innerHTML=[["Visitas hoy",d.visits_today],["Artículos hoy",d.articles_today],["Posts",d.posts_detected],["Borradores",d.drafts]].map(x=>"<div class=\"metric\"><small>"+esc(x[0])+"</small><strong>"+esc(x[1])+"</strong></div>").join("");q("#sources").innerHTML=s.map(x=>"<div class=\"item\"><strong>"+esc(x.name)+"</strong> <span class=\"badge\">"+(x.enabled?"Activa":"Pausada")+"</span><p>"+esc(x.facebook_url)+"</p><button class=\"button\" data-source=\""+x.id+"\" data-enabled=\""+(x.enabled?0:1)+"\">"+(x.enabled?"Pausar":"Activar")+"</button></div>").join("")||"<p>No hay fuentes.</p>";q("#raw").innerHTML=r.map(x=>"<div class=\"item\"><strong>"+esc(x.source_name)+"</strong> <span class=\"badge\">"+esc(x.processing_status)+"</span><p>"+esc((x.text||"").slice(0,180))+"</p>"+(!["DRAFTED","PUBLISHED","REJECTED"].includes(x.processing_status)?"<button class=\"button\" data-draft=\""+x.id+"\">Crear borrador</button>":"")+"</div>").join("")||"<p>No hay posts detectados.</p>";q("#drafts").innerHTML=w.map(x=>"<div class=\"item\"><strong>"+esc(x.title)+"</strong> <span class=\"badge "+(x.verification_status==="VERIFY"?"warn":"")+"\">"+esc(x.editorial_status)+" · "+esc(x.verification_status)+"</span><p>"+esc(x.dek)+"<br>Fuente: "+esc(x.source_name)+"</p>"+(x.editorial_status==="DRAFT"?"<button class=\"button dark\" data-publish=\""+x.id+"\">"+(x.verification_status==="VERIFY"?"Confirmar y publicar":"Publicar")+"</button>":"")+"</div>").join("")||"<p>No hay borradores.</p>";document.querySelectorAll("[data-source]").forEach(b=>b.onclick=async()=>{await api("/api/admin/sources/"+b.dataset.source,{method:"PATCH",body:JSON.stringify({enabled:b.dataset.enabled==="1"})});load()});document.querySelectorAll("[data-draft]").forEach(b=>b.onclick=async()=>{await api("/api/admin/raw-posts/"+b.dataset.draft+"/draft",{method:"POST",body:"{}"});load()});document.querySelectorAll("[data-publish]").forEach(b=>b.onclick=async()=>{if(confirm("Confirma revisión editorial y publicación.")){await api("/api/admin/drafts/"+b.dataset.publish+"/publish",{method:"POST",body:JSON.stringify({verified:true})});load()}})}q("#login-form").onsubmit=async e=>{e.preventDefault();try{await api("/api/auth/login",{method:"POST",body:JSON.stringify({password:new FormData(e.target).get("password")})});q("#login").classList.add("hidden");q("#app").classList.remove("hidden");load()}catch(x){q("#error").textContent=x.message}};q("#ingest").onclick=async()=>{try{await api("/api/admin/ingest",{method:"POST"});load()}catch(x){alert(x.message)}};api("/api/admin/session").then(()=>{q("#login").classList.add("hidden");q("#app").classList.remove("hidden");load()}).catch(()=>{})})();</script>`;
  const deferredScript = script
    .replace('<script>(()=>{', '<script>document.addEventListener("DOMContentLoaded",()=>{(()=>{')
    .replace('})();</script>', '})();});</script>');
  return html(layout(env, request, 'Panel editorial · Sullana Noticias', 'Panel de revisión editorial.', body, deferredScript));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (env.DB) ctx.waitUntil(seed(env.DB).catch((error) => console.error('seed', error)));
      if (url.pathname === '/api/health') return json({ web: 'OK', database: env.DB ? 'OK' : 'MISSING', scraper: env.INGEST_TOKEN ? 'PLAYWRIGHT_ADAPTER' : 'NOT_CONFIGURED', meta_graph: 'PENDING_EXTERNAL' });
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await bodyJson(request);
        if (!env.ADMIN_PASSWORD) return json({ error: 'ADMIN_PASSWORD_NOT_CONFIGURED' }, 503);
        const expected = await hmac(String(env.ADMIN_PASSWORD), String(env.ADMIN_PASSWORD));
        const supplied = await hmac(String(body.password || ''), String(env.ADMIN_PASSWORD));
        if (!sameBytes(expected, supplied)) return json({ error: 'INVALID_CREDENTIALS' }, 401);
        return json({ ok: true }, 200, { 'set-cookie': `sullana_session=${await adminCookie(env)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800` });
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') return json({ ok: true }, 200, { 'set-cookie': 'sullana_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
      if (url.pathname === '/api/events' && request.method === 'POST' && env.DB) { const event = await bodyJson(request); const allowed = new Set(['share_click','copy_link','whatsapp_share','facebook_share','newsletter_click','editor_login']); if (!allowed.has(String(event.event_name))) return json({ error:'EVENT_NOT_ALLOWED' },400); await dbRun(env.DB,'INSERT INTO events (event_name,article_id,metadata_json) VALUES (?,?,?)',String(event.event_name),Number.isInteger(event.article_id)?event.article_id:null,JSON.stringify(event.metadata||{})); return json({ok:true},202); }
      if (url.pathname === '/api/ingest' && request.method === 'POST') { if (!await authorizedIngest(request, env)) return json({ error:'INGEST_AUTH_REQUIRED' },401); return json(await persistIngest(env, await bodyJson(request))); }
      if (url.pathname.startsWith('/api/admin/')) {
        if (!await isAdmin(request, env)) return json({ error:'AUTH_REQUIRED' },401);
        if (url.pathname === '/api/admin/session') return json({authenticated:true});
        if (!env.DB) return json({ error:'DATABASE_NOT_CONFIGURED' },503);
        if (url.pathname === '/api/admin/dashboard') return json(await dashboard(env));
        if (url.pathname === '/api/admin/sources' && request.method === 'GET') return json(await dbRows(env.DB,'SELECT * FROM sources ORDER BY created_at DESC'));
        if (url.pathname === '/api/admin/raw-posts' && request.method === 'GET') return json(await dbRows(env.DB,'SELECT r.*,s.name AS source_name FROM raw_posts r JOIN sources s ON s.id=r.source_id ORDER BY r.fetched_at DESC LIMIT 100'));
        if (url.pathname === '/api/admin/drafts' && request.method === 'GET') return json(await dbRows(env.DB,'SELECT d.*,c.name AS category_name FROM news_drafts d LEFT JOIN categories c ON c.id=d.category_id ORDER BY d.updated_at DESC'));
        if (url.pathname === '/api/admin/ingest' && request.method === 'POST') return json({error:'SCRAPER_EXTERNAL_REQUIRED',message:'El Worker no ejecuta Python; ejecuta el PlaywrightFacebookSourceAdapter externo y publica el payload firmado en /api/ingest.'},503);
        const source = url.pathname.match(/^\/api\/admin\/sources\/(\d+)$/);
        if (source && request.method === 'PATCH') { const body=await bodyJson(request); await dbRun(env.DB,'UPDATE sources SET enabled=COALESCE(?,enabled),trust_level=COALESCE(?,trust_level),auto_draft=COALESCE(?,auto_draft),auto_publish=0 WHERE id=?',body.enabled===undefined?null:(body.enabled?1:0),body.trust_level||null,body.auto_draft===undefined?null:(body.auto_draft?1:0),Number(source[1])); return json(await dbFirst(env.DB,'SELECT * FROM sources WHERE id=?',Number(source[1]))); }
        const rawDraft = url.pathname.match(/^\/api\/admin\/raw-posts\/(\d+)\/draft$/);
        if (rawDraft && request.method === 'POST') { const raw=await dbFirst(env.DB,'SELECT * FROM raw_posts WHERE id=?',Number(rawDraft[1])); if(!raw)return json({error:'RAW_POST_NOT_FOUND'},404); const existing=await dbFirst(env.DB,'SELECT * FROM news_drafts WHERE raw_post_id=?',raw.id); return json(existing||await createDraft(env.DB,raw),existing?200:201); }
        const draft = url.pathname.match(/^\/api\/admin\/drafts\/(\d+)$/);
        if (draft && request.method === 'PUT') { const body=await bodyJson(request); await dbRun(env.DB,'UPDATE news_drafts SET title=?,dek=?,body=?,category_id=COALESCE((SELECT id FROM categories WHERE slug=?),category_id),meta_title=?,meta_description=?,updated_at=? WHERE id=?',String(body.title||''),String(body.dek||''),String(body.body||''),String(body.category_slug||'actualidad'),String(body.meta_title||body.title||''),String(body.meta_description||body.dek||''),now(),Number(draft[1])); return json(await dbFirst(env.DB,'SELECT * FROM news_drafts WHERE id=?',Number(draft[1]))); }
        const publish = url.pathname.match(/^\/api\/admin\/drafts\/(\d+)\/publish$/);
        if (publish && request.method === 'POST') { const body=await bodyJson(request); const item=await dbFirst(env.DB,'SELECT * FROM news_drafts WHERE id=?',Number(publish[1])); if(!item)return json({error:'DRAFT_NOT_FOUND'},404); if(item.verification_status==='VERIFY'&&body.verified!==true)return json({error:'VERIFICATION_REQUIRED'},409); const canonical=`${originOf(request)}/noticias/${item.slug}`; const result=await dbRun(env.DB,'INSERT INTO articles (draft_id,category_id,title,dek,summary,body,keywords,meta_title,meta_description,slug,canonical_url,source_name,source_url,original_post_url,original_published_at,image_type,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',item.id,item.category_id,item.title,item.dek,item.summary,item.body,item.keywords,item.meta_title,item.meta_description,item.slug,canonical,item.source_name,item.source_url,item.original_post_url,item.original_published_at,item.image_type,item.image_url); await dbRun(env.DB,'UPDATE news_drafts SET editorial_status=\'PUBLISHED\',verification_status=\'VERIFIED\',updated_at=? WHERE id=?',now(),item.id); await dbRun(env.DB,'UPDATE raw_posts SET processing_status=\'PUBLISHED\',verification_status=\'VERIFIED\' WHERE id=?',item.raw_post_id); return json({article:await dbFirst(env.DB,'SELECT * FROM articles WHERE id=?',result.meta?.last_row_id)},201); }
        return json({error:'NOT_FOUND'},404);
      }
      if (url.pathname === '/sitemap.xml') { const articles=await articleRows(env,100); const base=originOf(request); return text(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(base)}/</loc></url>${articles.map((item)=>`<url><loc>${esc(base)}/noticias/${esc(item.slug)}</loc><lastmod>${esc(item.modified_at)}</lastmod></url>`).join('')}</urlset>`,'application/xml; charset=utf-8',200,{'cache-control':'public,max-age=300'}); }
      if (url.pathname === '/rss.xml') { const articles=await articleRows(env,30); const base=originOf(request); return text(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Sullana Noticias</title><link>${esc(base)}</link><description>Noticias locales de Sullana, Piura.</description>${articles.map((item)=>`<item><title>${esc(item.title)}</title><link>${esc(base)}/noticias/${esc(item.slug)}</link><guid>${esc(base)}/noticias/${esc(item.slug)}</guid><description>${esc(item.dek||item.summary)}</description></item>`).join('')}</channel></rss>`,'application/rss+xml; charset=utf-8',200,{'cache-control':'public,max-age=300'}); }
      if (url.pathname === '/robots.txt') return text(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${originOf(request)}/sitemap.xml\n`);
      if (url.pathname === '/admin') return adminPage(env, request);
      if (url.pathname.startsWith('/noticias/')) return article(env, request, decodeURIComponent(url.pathname.slice('/noticias/'.length)));
      if (url.pathname.startsWith('/categoria/')) return category(env, request, decodeURIComponent(url.pathname.slice('/categoria/'.length)));
      return home(env, request);
    } catch (error) { console.error(error); return json({ error:'INTERNAL_ERROR' },500); }
  },
};
