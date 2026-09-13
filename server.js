import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { getArticleBySlug, getCategory, insertBaseCategories, listArticles, openDatabase, recordEvent, uniqueSlug, contentHash } from './src/db.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || `http://localhost:${process.env.PORT || 8787}`).replace(/\/$/, '');
const PORT = Number(process.env.PORT || 8787);
const db = openDatabase();
insertBaseCategories(db);
const sessions = new Map();

const localTerms = ['sullana', 'bellavista', 'marcavelica', 'querecotillo', 'lancones', 'miguel checa', 'salitral', 'piura', 'mallares', 'sullana'];
const sensitiveTerms = ['accidente', 'delito', 'fallec', 'denuncia', 'emergencia', 'acusaci', 'asesin', 'muerte', 'política', 'politica'];

function now() { return new Date().toISOString(); }

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  if (!value) return 'Sin fecha confirmada';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Sin fecha confirmada';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(date);
}

function articleCard(article) {
  return `<article class="story-card">
    <div class="story-card__eyebrow">${escapeHtml(article.category_name || 'Actualidad')} · ${escapeHtml(formatDate(article.published_at))}</div>
    <h3><a href="/noticias/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
    <p>${escapeHtml(article.dek || article.summary || '')}</p>
    <a class="text-link" href="/noticias/${encodeURIComponent(article.slug)}">Leer noticia <span aria-hidden="true">↗</span></a>
  </article>`;
}

function layout({ title, description, body, extraHead = '' }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(SITE_URL)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Sullana Noticias">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(SITE_URL)}">
  <meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="/styles.css">
  ${extraHead}
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="site-header">
    <div class="shell header-row">
      <a class="brand" href="/" aria-label="Sullana Noticias, inicio"><span class="brand-mark">SN</span><span>Sullana<br><strong>Noticias</strong></span></a>
      <nav class="main-nav" aria-label="Navegación principal">
        <a href="/">Inicio</a><a href="/categoria/actualidad">Actualidad</a><a href="/categoria/servicios">Servicios</a><a href="/categoria/seguridad">Seguridad</a><a href="/categoria/deportes">Deportes</a><a href="/admin">Panel</a>
      </nav>
    </div>
  </header>
  <main id="contenido">${body}</main>
  <footer class="site-footer"><div class="shell footer-grid"><div><div class="brand brand--footer"><span class="brand-mark">SN</span><span>Sullana<br><strong>Noticias</strong></span></div><p>Información local, contexto claro y fuentes identificables.</p></div><div><p class="footer-label">Cobertura inicial</p><p>Sullana · Bellavista · Marcavelica · Piura</p></div><div><p class="footer-label">Transparencia</p><a href="/rss.xml">RSS</a> · <a href="/sitemap.xml">Mapa del sitio</a></div></div></footer>
  <script src="/app.js" defer></script>
</body>
</html>`;
}

function renderHome() {
  const articles = listArticles(db, 30);
  const lead = articles[0];
  const rest = articles.slice(1);
  const body = `<section class="hero shell">
    <div class="hero__kicker"><span class="live-dot"></span> Noticias locales · Sullana, Piura</div>
    <h1>Lo que pasa cerca,<br><em>bien contado.</em></h1>
    <p class="hero__lede">Un medio local independiente para seguir servicios, comunidad y actualidad de la provincia.</p>
    <div class="hero__meta"><span>Actualizado ${escapeHtml(formatDate(new Date()))}</span><span class="hero__rule"></span><span>Fuentes públicas + revisión editorial</span></div>
  </section>
  <section class="shell section-block" aria-labelledby="ultimas">
    <div class="section-heading"><div><span class="section-kicker">01 / Ahora</span><h2 id="ultimas">Últimas noticias</h2></div><a class="text-link" href="/categoria/actualidad">Ver todo <span aria-hidden="true">↗</span></a></div>
    ${lead ? `<div class="lead-story"><div class="lead-story__image" aria-hidden="true"><span>SN</span></div><div><div class="story-card__eyebrow">${escapeHtml(lead.category_name || 'Actualidad')} · ${escapeHtml(formatDate(lead.published_at))}</div><h3><a href="/noticias/${encodeURIComponent(lead.slug)}">${escapeHtml(lead.title)}</a></h3><p>${escapeHtml(lead.dek || lead.summary || '')}</p><a class="button button--dark" href="/noticias/${encodeURIComponent(lead.slug)}">Leer noticia</a></div></div>` : `<div class="empty-state"><strong>El primer despacho está por llegar.</strong><p>El sistema está listo para recibir fuentes públicas y pasar cada hallazgo por revisión editorial.</p></div>`}
    <div class="story-grid">${rest.map(articleCard).join('')}</div>
  </section>
  <section class="shell section-block section-block--tint"><div class="section-heading"><div><span class="section-kicker">02 / Criterio</span><h2>Cómo trabajamos</h2></div></div><div class="principles"><div><span>01</span><h3>Fuente identificable</h3><p>Cada nota conserva enlace y fecha de la publicación original.</p></div><div><span>02</span><h3>Redacción propia</h3><p>El contenido editorial no copia textos ni inventa datos.</p></div><div><span>03</span><h3>Revisión humana</h3><p>Accidentes, denuncias y emergencias no se autopublican.</p></div></div></section>`;
  return layout({ title: 'Sullana Noticias · Actualidad local', description: 'Noticias locales de Sullana, Piura: actualidad, servicios, comunidad y agenda.', body });
}

function renderCategory(slug) {
  const category = getCategory(db, slug);
  const articles = listArticles(db, 100).filter((article) => article.category_slug === category.slug);
  const body = `<section class="shell page-intro"><span class="section-kicker">Archivo local</span><h1>${escapeHtml(category.name)}</h1><p>Noticias y publicaciones editoriales de ${escapeHtml(category.name.toLowerCase())} en Sullana y la provincia.</p></section><section class="shell section-block"><div class="story-grid story-grid--wide">${articles.length ? articles.map(articleCard).join('') : '<div class="empty-state"><strong>Aún no hay publicaciones en esta sección.</strong><p>El panel editorial mostrará aquí cada artículo aprobado.</p></div>'}</div></section>`;
  return layout({ title: `${category.name} · Sullana Noticias`, description: `Noticias de ${category.name.toLowerCase()} en Sullana, Piura.`, body });
}

function renderArticle(article) {
  const bodyHtml = escapeHtml(article.body || article.summary || '').replaceAll('\n', '<br>');
  const canonical = `${SITE_URL}/noticias/${article.slug}`;
  const extraHead = `<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(article.title)}"><meta property="og:description" content="${escapeHtml(article.meta_description || article.dek)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="article:published_time" content="${escapeHtml(article.published_at)}"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: article.title, description: article.meta_description || article.dek, datePublished: article.published_at, dateModified: article.modified_at, mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Sullana Noticias' }, publisher: { '@type': 'Organization', name: 'Sullana Noticias' } })}</script>`;
  const body = `<article class="shell article-page"><div class="article-page__crumb"><a href="/">Inicio</a> / ${escapeHtml(article.category_name || 'Actualidad')}</div><div class="article-page__eyebrow">${escapeHtml(article.category_name || 'Actualidad')} · ${escapeHtml(formatDate(article.published_at))}</div><h1>${escapeHtml(article.title)}</h1><p class="article-page__dek">${escapeHtml(article.dek || article.summary)}</p><div class="article-page__source">Fuente: <a href="${escapeHtml(article.source_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(article.source_name)}</a> · <a href="${escapeHtml(article.original_post_url)}" rel="nofollow noopener" target="_blank">publicación original</a></div><div class="article-page__body">${bodyHtml}</div><div class="share-row"><strong>Compartir</strong><button data-share="whatsapp" data-url="${escapeHtml(canonical)}" data-title="${escapeHtml(article.title)}">WhatsApp</button><button data-share="facebook" data-url="${escapeHtml(canonical)}">Facebook</button><button data-share="copy" data-url="${escapeHtml(canonical)}">Copiar enlace</button></div></article>`;
  return layout({ title: article.meta_title || `${article.title} · Sullana Noticias`, description: article.meta_description || article.dek, body, extraHead });
}

function renderAdmin() {
  const body = `<section class="shell admin-shell"><div class="admin-top"><div><span class="section-kicker">Operaciones</span><h1>Panel editorial</h1><p>Detecta, verifica, redacta y publica con trazabilidad.</p></div><button class="button button--dark" id="logout-button" hidden>Salir</button></div><div id="login-panel" class="admin-card"><h2>Acceso editorial</h2><p>La sesión usa una cookie HttpOnly. La contraseña vive solo en el entorno del servidor.</p><form id="login-form"><label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label><button class="button button--dark" type="submit">Entrar</button><p class="form-error" id="login-error" role="alert"></p></form></div><div id="admin-app" hidden><div class="dashboard-grid" id="dashboard-cards"></div><div class="admin-columns"><section class="admin-card"><div class="card-heading"><div><span class="section-kicker">Fuentes</span><h2>Fuentes activas</h2></div><button class="button button--small" id="ingest-button">Revisar ahora</button></div><div id="sources-list"></div></section><section class="admin-card"><div class="card-heading"><div><span class="section-kicker">Entrada</span><h2>Posts detectados</h2></div></div><div id="raw-posts-list"></div></section></div><section class="admin-card"><div class="card-heading"><div><span class="section-kicker">Edición</span><h2>Borradores</h2></div></div><div id="drafts-list"></div></section></div></section>`;
  return layout({ title: 'Panel editorial · Sullana Noticias', description: 'Panel de revisión editorial.', body });
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 1_000_000) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function send(res, status, contentType, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function sendJson(res, status, value, headers = {}) { send(res, status, 'application/json; charset=utf-8', JSON.stringify(value), headers); }

function cookie(req, name) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function isAdmin(req) {
  const token = cookie(req, 'sullana_session');
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) return false;
  return true;
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    sendJson(res, 401, { error: 'AUTH_REQUIRED' });
    return false;
  }
  return true;
}

function deriveTitle(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const first = clean.split(/[.!?]\s/)[0] || clean;
  return (first.length > 100 ? `${first.slice(0, 97)}…` : first) || 'Nueva publicación local';
}

function relevance(text) {
  const normalized = String(text || '').toLowerCase();
  const local = localTerms.some((term) => normalized.includes(term));
  const sensitive = sensitiveTerms.some((term) => normalized.includes(term));
  return { local, sensitive, status: local ? (sensitive ? 'VERIFY' : 'RELEVANT') : 'NOT_RELEVANT' };
}

function createDraftFromRaw(raw) {
  const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(raw.source_id);
  if (!source) throw new Error('SOURCE_NOT_FOUND');
  const category = getCategory(db, 'actualidad');
  const title = deriveTitle(raw.text);
  const slug = uniqueSlug(db, title);
  const check = relevance(raw.text);
  const verification = check.sensitive || source.trust_level !== 'OFFICIAL' ? 'VERIFY' : 'UNVERIFIED';
  const result = db.prepare(`INSERT INTO news_drafts (raw_post_id, category_id, title, dek, summary, body, keywords, meta_title, meta_description, slug, source_name, source_url, original_post_url, original_published_at, image_type, image_url, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(raw.id, category.id, title, 'Borrador pendiente de revisión editorial.', raw.text, raw.text, 'Sullana, Piura, actualidad local', title, raw.text.slice(0, 155), slug, source.name, source.facebook_url, raw.post_url, raw.published_at, raw.image_url ? 'SOURCE_IMAGE' : 'NO_IMAGE', raw.image_url || null, verification);
  db.prepare('UPDATE raw_posts SET processing_status = ?, verification_status = ? WHERE id = ?').run('DRAFTED', verification, raw.id);
  return db.prepare('SELECT * FROM news_drafts WHERE id = ?').get(Number(result.lastInsertRowid));
}

function startIngest() {
  const sources = db.prepare('SELECT * FROM sources WHERE enabled = 1 ORDER BY id').all();
  const runId = crypto.randomUUID();
  const startedAt = now();
  const runResult = db.prepare('INSERT INTO scrape_runs (run_id, started_at, sources_checked, status) VALUES (?, ?, ?, ?)').run(runId, startedAt, sources.length, 'RUNNING');
  const script = path.join(ROOT, 'services', 'facebook-ingestor', 'run.py');
  const result = spawnSync('python3', [script], { input: JSON.stringify({ sources, page_limit: Number(process.env.FACEBOOK_PAGE_LIMIT || 3), timeout: Number(process.env.SCRAPER_TIMEOUT_SECONDS || 25) }), encoding: 'utf8', timeout: 120_000, env: { ...process.env, PYTHONPATH: process.env.PYTHONPATH || '' } });
  let payload = null;
  let errors = [];
  try { payload = JSON.parse(result.stdout || '{}'); } catch { errors.push(result.stderr || 'SCRAPER_INVALID_JSON'); }
  if (result.error) errors.push(result.error.message);
  if (payload?.errors) errors.push(...payload.errors.map((error) => `${error.source}: ${error.message}`));
  const posts = payload?.posts || [];
  let newPosts = 0;
  let duplicates = 0;
  const insert = db.prepare(`INSERT OR IGNORE INTO raw_posts (source_id, external_post_id, text, post_url, image_url, published_at, fetched_at, content_hash, processing_status, verification_status, likes, comments, shares, reactions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const post of posts) {
    const source = sources.find((item) => item.facebook_identifier === post.page_identifier || item.facebook_url === post.source_url) || sources.find((item) => item.id === post.source_id);
    if (!source || !post.post_url) continue;
    const check = relevance(post.text);
    const hash = contentHash(post.text, post.post_url);
    const outcome = insert.run(source.id, post.post_id || null, post.text || '', post.post_url, post.image || null, post.published_at || null, now(), hash, check.status, check.sensitive ? 'VERIFY' : 'UNVERIFIED', post.likes ?? null, post.comments ?? null, post.shares ?? null, JSON.stringify(post.reactions || null));
    if (outcome.changes) {
      newPosts += 1;
      if (source.auto_draft && check.status !== 'NOT_RELEVANT') {
        const saved = db.prepare('SELECT * FROM raw_posts WHERE content_hash = ?').get(hash);
        try { createDraftFromRaw(saved); } catch (error) { errors.push(`${source.name}: draft creation failed: ${error.message}`); }
      }
    } else duplicates += 1;
  }
  const status = errors.length && !posts.length ? 'ERROR' : errors.length ? 'PARTIAL' : 'SUCCESS';
  db.prepare('UPDATE scrape_runs SET finished_at = ?, posts_found = ?, new_posts = ?, duplicates = ?, errors = ?, status = ?, error_message = ? WHERE id = ?').run(now(), posts.length, newPosts, duplicates, errors.length, status, errors.join(' | ') || null, Number(runResult.lastInsertRowid));
  for (const source of sources) db.prepare('UPDATE sources SET last_checked_at = ?, last_success_at = CASE WHEN ? IN (\'SUCCESS\', \'PARTIAL\') THEN ? ELSE last_success_at END WHERE id = ?').run(now(), status, now(), source.id);
  return { run_id: runId, status, posts_found: posts.length, new_posts: newPosts, duplicates, errors };
}

function dashboard() {
  const count = (table, where = '') => db.prepare(`SELECT COUNT(*) AS total FROM ${table} ${where}`).get().total;
  return { visits_today: count('events', "WHERE event_name = 'article_view' AND date(created_at) = date('now')"), articles_today: count('articles', "WHERE date(published_at) = date('now')"), sources_enabled: count('sources', 'WHERE enabled = 1'), posts_detected: count('raw_posts'), drafts: count('news_drafts', "WHERE editorial_status = 'DRAFT'"), published: count('articles'), last_scrape: db.prepare('SELECT * FROM scrape_runs ORDER BY started_at DESC LIMIT 1').get() || null };
}

function sitemap() {
  const urls = listArticles(db, 100).map((article) => `<url><loc>${escapeHtml(`${SITE_URL}/noticias/${article.slug}`)}</loc><lastmod>${escapeHtml(article.modified_at)}</lastmod><changefreq>hourly</changefreq></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(SITE_URL)}/</loc><changefreq>hourly</changefreq></url>${urls}</urlset>`;
}

function rss() {
  const items = listArticles(db, 30).map((article) => `<item><title>${escapeHtml(article.title)}</title><link>${escapeHtml(`${SITE_URL}/noticias/${article.slug}`)}</link><guid isPermaLink="true">${escapeHtml(`${SITE_URL}/noticias/${article.slug}`)}</guid><description>${escapeHtml(article.dek || article.summary)}</description><pubDate>${new Date(article.published_at).toUTCString()}</pubDate></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Sullana Noticias</title><link>${escapeHtml(SITE_URL)}</link><description>Noticias locales de Sullana, Piura.</description>${items}</channel></rss>`;
}

async function handle(req, res) {
  const url = new URL(req.url, SITE_URL);
  const pathname = decodeURIComponent(url.pathname);
  try {
    if (pathname === '/api/health') return sendJson(res, 200, { web: 'OK', database: 'OK', scraper: fs.existsSync(path.join(ROOT, 'services/facebook-ingestor', 'run.py')) ? 'READY' : 'MISSING', last_scrape: db.prepare('SELECT started_at, status FROM scrape_runs ORDER BY started_at DESC LIMIT 1').get() || null });
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      const configured = process.env.ADMIN_PASSWORD;
      if (!configured) return sendJson(res, 503, { error: 'ADMIN_PASSWORD_NOT_CONFIGURED' });
      const expected = Buffer.from(configured);
      const provided = Buffer.from(String(body.password || ''));
      if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) return sendJson(res, 401, { error: 'INVALID_CREDENTIALS' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { expires: Date.now() + 8 * 60 * 60 * 1000 });
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `sullana_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}` });
    }
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const token = cookie(req, 'sullana_session');
      if (token) sessions.delete(token);
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'sullana_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' });
    }
    if (pathname === '/api/articles' && req.method === 'GET') return sendJson(res, 200, listArticles(db, url.searchParams.get('limit')));
    if (pathname.startsWith('/api/articles/') && req.method === 'GET') {
      const article = getArticleBySlug(db, pathname.slice('/api/articles/'.length));
      if (!article) return sendJson(res, 404, { error: 'NOT_FOUND' });
      recordEvent(db, 'article_view', article.id, { path: pathname });
      db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(article.id);
      return sendJson(res, 200, article);
    }
    if (pathname.startsWith('/api/admin/')) {
      if (!requireAdmin(req, res)) return;
      if (pathname === '/api/admin/dashboard' && req.method === 'GET') return sendJson(res, 200, dashboard());
      if (pathname === '/api/admin/sources' && req.method === 'GET') return sendJson(res, 200, db.prepare('SELECT * FROM sources ORDER BY created_at DESC').all());
      if (pathname === '/api/admin/sources' && req.method === 'POST') {
        const body = await readBody(req);
        const identifier = String(body.facebook_identifier || body.facebook_url || '').replace(/^https?:\/\/(www\.)?facebook\.com\//, '').replace(/\/$/, '');
        const result = db.prepare('INSERT INTO sources (name, facebook_url, facebook_identifier, trust_level, enabled, auto_draft, auto_publish) VALUES (?, ?, ?, ?, ?, ?, 0)').run(String(body.name || identifier), String(body.facebook_url || `https://www.facebook.com/${identifier}/`), identifier, body.trust_level || 'UNVERIFIED', body.enabled ? 1 : 0, body.auto_draft === false ? 0 : 1);
        return sendJson(res, 201, db.prepare('SELECT * FROM sources WHERE id = ?').get(Number(result.lastInsertRowid)));
      }
      const sourceMatch = pathname.match(/^\/api\/admin\/sources\/(\d+)$/);
      if (sourceMatch && req.method === 'PATCH') {
        const body = await readBody(req);
        db.prepare('UPDATE sources SET enabled = COALESCE(?, enabled), trust_level = COALESCE(?, trust_level), auto_draft = COALESCE(?, auto_draft), auto_publish = 0 WHERE id = ?').run(body.enabled === undefined ? null : (body.enabled ? 1 : 0), body.trust_level || null, body.auto_draft === undefined ? null : (body.auto_draft ? 1 : 0), Number(sourceMatch[1]));
        return sendJson(res, 200, db.prepare('SELECT * FROM sources WHERE id = ?').get(Number(sourceMatch[1])));
      }
      if (sourceMatch && req.method === 'DELETE') {
        db.prepare('DELETE FROM sources WHERE id = ?').run(Number(sourceMatch[1]));
        return sendJson(res, 200, { ok: true });
      }
      if (pathname === '/api/admin/ingest' && req.method === 'POST') return sendJson(res, 200, startIngest());
      if (pathname === '/api/admin/raw-posts' && req.method === 'GET') return sendJson(res, 200, db.prepare(`SELECT r.*, s.name AS source_name FROM raw_posts r JOIN sources s ON s.id = r.source_id ORDER BY r.fetched_at DESC LIMIT 100`).all());
      if (pathname === '/api/admin/drafts' && req.method === 'GET') return sendJson(res, 200, db.prepare(`SELECT d.*, c.name AS category_name FROM news_drafts d LEFT JOIN categories c ON c.id = d.category_id ORDER BY d.updated_at DESC`).all());
      const rawDraftMatch = pathname.match(/^\/api\/admin\/raw-posts\/(\d+)\/draft$/);
      if (rawDraftMatch && req.method === 'POST') {
        const raw = db.prepare('SELECT * FROM raw_posts WHERE id = ?').get(Number(rawDraftMatch[1]));
        if (!raw) return sendJson(res, 404, { error: 'RAW_POST_NOT_FOUND' });
        const existing = db.prepare('SELECT * FROM news_drafts WHERE raw_post_id = ?').get(raw.id);
        return sendJson(res, existing ? 200 : 201, existing || createDraftFromRaw(raw));
      }
      const rejectRawMatch = pathname.match(/^\/api\/admin\/raw-posts\/(\d+)\/reject$/);
      if (rejectRawMatch && req.method === 'POST') {
        db.prepare('UPDATE raw_posts SET processing_status = ?, verification_status = ? WHERE id = ?').run('REJECTED', 'VERIFIED', Number(rejectRawMatch[1]));
        return sendJson(res, 200, { ok: true });
      }
      const draftMatch = pathname.match(/^\/api\/admin\/drafts\/(\d+)$/);
      if (draftMatch && req.method === 'PUT') {
        const body = await readBody(req);
        db.prepare('UPDATE news_drafts SET title = ?, dek = ?, body = ?, category_id = COALESCE((SELECT id FROM categories WHERE slug = ?), category_id), meta_title = ?, meta_description = ?, updated_at = ? WHERE id = ?').run(String(body.title || ''), String(body.dek || ''), String(body.body || ''), String(body.category_slug || 'actualidad'), String(body.meta_title || body.title || ''), String(body.meta_description || body.dek || ''), now(), Number(draftMatch[1]));
        return sendJson(res, 200, db.prepare('SELECT * FROM news_drafts WHERE id = ?').get(Number(draftMatch[1])));
      }
      const publishMatch = pathname.match(/^\/api\/admin\/drafts\/(\d+)\/publish$/);
      if (publishMatch && req.method === 'POST') {
        const body = await readBody(req);
        const draft = db.prepare('SELECT * FROM news_drafts WHERE id = ?').get(Number(publishMatch[1]));
        if (!draft) return sendJson(res, 404, { error: 'DRAFT_NOT_FOUND' });
        if (draft.verification_status === 'VERIFY' && body.verified !== true) return sendJson(res, 409, { error: 'VERIFICATION_REQUIRED', message: 'Este borrador necesita confirmación editorial explícita.' });
        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(draft.category_id);
        const canonical = `${SITE_URL}/noticias/${draft.slug}`;
        const result = db.prepare(`INSERT INTO articles (draft_id, category_id, title, dek, summary, body, keywords, meta_title, meta_description, slug, canonical_url, source_name, source_url, original_post_url, original_published_at, image_type, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(draft.id, draft.category_id, draft.title, draft.dek, draft.summary, draft.body, draft.keywords, draft.meta_title, draft.meta_description, draft.slug, canonical, draft.source_name, draft.source_url, draft.original_post_url, draft.original_published_at, draft.image_type, draft.image_url);
        db.prepare('UPDATE news_drafts SET editorial_status = ?, verification_status = ?, updated_at = ? WHERE id = ?').run('PUBLISHED', 'VERIFIED', now(), draft.id);
        db.prepare('UPDATE raw_posts SET processing_status = ?, verification_status = ? WHERE id = ?').run('PUBLISHED', 'VERIFIED', draft.raw_post_id);
        return sendJson(res, 201, { article: db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(result.lastInsertRowid)), category });
      }
      if (pathname === '/api/admin/session' && req.method === 'GET') return sendJson(res, 200, { authenticated: true });
      return sendJson(res, 404, { error: 'NOT_FOUND' });
    }
    if (pathname === '/sitemap.xml') return send(res, 200, 'application/xml; charset=utf-8', sitemap(), { 'Cache-Control': 'public, max-age=300' });
    if (pathname === '/rss.xml') return send(res, 200, 'application/rss+xml; charset=utf-8', rss(), { 'Cache-Control': 'public, max-age=300' });
    if (pathname === '/robots.txt') return send(res, 200, 'text/plain; charset=utf-8', `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    if (pathname === '/styles.css' || pathname === '/app.js' || pathname === '/admin.js') {
      const file = path.join(PUBLIC_DIR, pathname.slice(1));
      if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file)) return send(res, 404, 'text/plain', 'Not found');
      return send(res, 200, pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8', fs.readFileSync(file), { 'Cache-Control': 'public, max-age=300' });
    }
    if (pathname === '/admin') return send(res, 200, 'text/html; charset=utf-8', renderAdmin());
    if (pathname.startsWith('/noticias/')) {
      const article = getArticleBySlug(db, pathname.slice('/noticias/'.length));
      return article ? send(res, 200, 'text/html; charset=utf-8', renderArticle(article)) : send(res, 404, 'text/html; charset=utf-8', layout({ title: 'Noticia no encontrada', description: 'La noticia solicitada no está disponible.', body: '<section class="shell page-intro"><h1>Noticia no encontrada</h1><p>Puede haber sido retirada o aún está en revisión.</p><a class="button button--dark" href="/">Volver al inicio</a></section>' }));
    }
    if (pathname.startsWith('/categoria/')) return send(res, 200, 'text/html; charset=utf-8', renderCategory(pathname.slice('/categoria/'.length)));
    return send(res, 200, 'text/html; charset=utf-8', renderHome());
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }
}

const server = http.createServer((req, res) => { handle(req, res); });
server.listen(PORT, () => console.log(`Sullana Noticias listening on ${SITE_URL}`));

process.on('SIGINT', () => { db.close(); server.close(() => process.exit(0)); });
