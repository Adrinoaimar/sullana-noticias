import { buildEditorialCopy } from './editorial.js';

const enc = new TextEncoder();

const MONETAG_SITE_VERIFICATION = '<meta name="monetag" content="c955b399d7dd83b8622b8bcead567793">';
const MONETAG_AD_TAG = "<script>(function(s){s.dataset.zone='11796062',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>";

const STYLE = `
:root{--ink:#18312d;--muted:#6a7771;--paper:#f7f5ef;--tint:#e6eee8;--line:#d7dfd8;--accent:#e86f42;--dark:#18312d;--white:#fffefa;font-family:system-ui,-apple-system,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);line-height:1.55}a{color:inherit;text-decoration:none}a:hover{color:var(--accent)}.shell{width:min(1120px,calc(100% - 40px));margin:auto}.skip{position:absolute;left:-999px}.skip:focus{left:10px;top:10px;background:var(--dark);color:#fff;padding:10px}.header{border-bottom:1px solid var(--line)}.header-row{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:22px}.brand{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.02}.brand strong,h1,h2,h3{font-family:Georgia,serif}.brand strong{font-size:23px}.mark{display:grid;place-items:center;width:38px;height:38px;border-radius:13px 13px 13px 3px;background:var(--accent);color:#fff;font-size:12px;font-weight:700}.nav{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;font-weight:700;color:#52605a}.hero{padding:90px 0 72px}.kicker{color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.hero h1{font-size:clamp(54px,10vw,116px);line-height:1;letter-spacing:-.06em;max-width:760px;margin:18px 0 0}.hero h1 em{color:var(--accent);font-style:normal}.lede{max-width:490px;color:var(--muted);font-size:18px}.meta{color:#78847e;font-size:12px;margin-top:35px}.section{padding:44px 0 72px}.heading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:26px}.heading h2{font-size:42px;line-height:1;margin:8px 0 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{padding:22px;border:1px solid var(--line);background:#fffefa66}.card h3{font-size:28px;line-height:1.05;margin:12px 0}.card p{color:var(--muted);font-size:14px}.eyebrow{color:#76817b;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.button{display:inline-flex;min-height:42px;align-items:center;justify-content:center;padding:0 16px;border:1px solid var(--dark);background:transparent;color:var(--ink);font-weight:700;cursor:pointer}.button.dark{background:var(--dark);color:#fff}.empty{padding:36px;border:1px dashed #b6c2b9;color:var(--muted)}.empty strong{display:block;margin-bottom:8px;color:var(--ink);font:600 27px Georgia,serif}.tint{background:var(--tint);padding-left:max(20px,calc((100vw - 1120px)/2));padding-right:max(20px,calc((100vw - 1120px)/2))}.principles{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.principles h3{font-size:28px;margin:12px 0 8px}.principles p{max-width:280px;color:var(--muted);font-size:14px}.article{padding:70px 0 100px}.article h1{font-size:clamp(48px,7vw,92px);line-height:1;letter-spacing:-.06em;max-width:920px;margin:12px 0 24px}.dek{max-width:720px;color:var(--muted);font-size:20px}.source{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0;color:#69756f;font-size:12px}.source a{color:var(--accent);font-weight:700}.body{max-width:720px;margin:45px 0;font:24px/1.58 Georgia,serif}.share{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:12px}.share button{padding:8px 12px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}.footer{padding:52px 0;background:var(--dark);color:#d3dfd7;font-size:13px}.footer p{color:#aebdb4}.ad{width:min(1120px,calc(100% - 40px));min-height:48px;margin:20px auto;display:flex;align-items:center;justify-content:center;gap:10px;border:1px dashed #c7d0c9;color:#85918a;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.admin{padding:60px 0 100px}.admin-card{padding:24px;border:1px solid var(--line);margin:18px 0;background:#fffefa66}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{padding:18px;background:var(--dark);color:#fff}.metric small{display:block;color:#aebdb4;text-transform:uppercase;font-size:10px}.metric strong{display:block;font:600 38px Georgia,serif;margin-top:8px}.item{border-top:1px solid var(--line);padding:14px 0}.item:first-child{border-top:0}.item p{color:var(--muted);font-size:13px}.badge{padding:4px 7px;background:#dfe9e1;color:#36584b;font-size:10px;font-weight:800}.warn{background:#ffe6dc;color:#9b4629}label{display:block;color:var(--muted);font-size:12px;font-weight:700;margin:12px 0}input,textarea,select{display:block;width:100%;margin-top:6px;padding:11px;border:1px solid var(--line);background:#fffefa;font:14px system-ui}textarea{min-height:120px}.hidden{display:none}.ad small{color:#a2ada6}@media(max-width:760px){.shell{width:calc(100% - 28px)}.header-row{align-items:flex-start;flex-direction:column;padding:16px 0}.nav{gap:10px 15px}.hero{padding:65px 0 50px}.grid,.principles,.metrics{grid-template-columns:1fr}.heading{align-items:flex-start;flex-direction:column}.heading h2{font-size:36px}.article{padding:50px 0 75px}.body{font-size:21px}.tint{padding-left:14px;padding-right:14px}}
`;

const RESPONSIVE_LAYOUT_STYLE = `
@media (min-width:521px) and (max-width:760px){.grid,.principles{grid-template-columns:repeat(2,minmax(0,1fr))}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
.hero{padding:28px 0 20px}.hero h1{font-size:clamp(44px,7vw,76px)}
@media(max-width:760px){.hero{padding:30px 0 12px}.hero h1{font-size:clamp(42px,8vw,82px)}.hero .lede{margin:12px 0;font-size:16px}.hero .meta{margin-top:10px}.home-news{padding-top:24px;scroll-margin-top:18px}.home-news>.meta{margin-top:12px}.home-news .heading{margin-bottom:14px}}
`;

const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const PUBLIC_SECTIONS = [
  ['actualidad', 'Actualidad'],
  ['servicios', 'Servicios'],
  ['seguridad', 'Seguridad'],
  ['asaltos', 'Asaltos'],
  ['emergencias', 'Emergencias'],
  ['presidencia', 'Presidencia'],
  ['politica-local', 'Política local'],
  ['educacion', 'Educación'],
  ['deportes', 'Deportes'],
  ['eventos', 'Eventos'],
  ['economia', 'Economía'],
  ['empleo', 'Empleo'],
  ['comunidad', 'Comunidad'],
  ['entretenimiento', 'Entretenimiento'],
];
const publicSectionLinks = () => PUBLIC_SECTIONS.map(([slug, name]) => `<a href="/categoria/${slug}">${name}</a>`).join('');
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const html = (value, status = 200, headers = {}) => new Response(value, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const text = (value, type = 'text/plain; charset=utf-8', status = 200, headers = {}) => new Response(value, { status, headers: { 'content-type': type, ...headers } });
const now = () => new Date().toISOString();
const originOf = (request) => new URL(request.url).origin;
const isoDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? `${raw.replace(' ', 'T')}Z` : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const rfc822Date = (value) => {
  const iso = isoDate(value);
  return iso ? new Date(iso).toUTCString() : null;
};
const dbRows = async (db, sql, ...values) => (await db.prepare(sql).bind(...values).all()).results || [];
const dbFirst = async (db, sql, ...values) => (await db.prepare(sql).bind(...values).first()) || null;
const dbRun = async (db, sql, ...values) => db.prepare(sql).bind(...values).run();
const bodyJson = async (request) => { try { return await request.json(); } catch { return {}; } };
const publicMediaUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const allowed = ['facebook.com', 'fbcdn.net', 'fbsbx.com'].some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (!allowed || !['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch { return null; }
};
const normalizeMedia = (value, fallbackImage = null) => {
  const input = Array.isArray(value) ? value : [];
  const output = [];
  const seen = new Set();
  for (const item of input.slice(0, 8)) {
    if (!item || !['image', 'video'].includes(String(item.kind))) continue;
    const url = publicMediaUrl(item.url);
    const poster = publicMediaUrl(item.poster);
    const key = url || poster;
    if (!key || seen.has(key)) continue;
    const media = { kind: String(item.kind), url };
    if (poster) media.poster = poster;
    if (item.alt) media.alt = String(item.alt).slice(0, 160);
    output.push(media);
    seen.add(key);
  }
  const image = publicMediaUrl(fallbackImage);
  if (image && !seen.has(image) && output.length < 8) output.unshift({ kind: 'image', url: image });
  return output;
};

const featuredImage = (article) => {
  const direct = publicMediaUrl(article?.image_url);
  if (direct) return { url: direct, alt: `Imagen de ${article.source_name || 'la fuente original'}` };
  try {
    const media = JSON.parse(article?.media_json || '[]');
    const image = Array.isArray(media) ? media.find((item) => item?.kind === 'image') : null;
    const url = publicMediaUrl(image?.url);
    return url ? { url, alt: String(image.alt || `Imagen de ${article.source_name || 'la fuente original'}`).slice(0, 160) } : null;
  } catch {
    return null;
  }
};

const imageMarkup = (article, className) => {
  const image = featuredImage(article);
  if (!image) return '';
  return `<figure class="${className}" style="margin:0 0 24px;overflow:hidden;background:#e6eee8"><img src="${esc(image.url)}" alt="${esc(image.alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover"><figcaption style="padding:8px 12px;color:#6a7771;font-size:11px">Imagen: ${esc(article.source_name || 'fuente original')}</figcaption></figure>`;
};

const signalText = (value) => String(value || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[013456]/g, (character) => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'o' })[character]);
const SENSITIVE_TERMS = ['accidente', 'delito', 'fallec', 'muere', 'muerto', 'muerta', 'denuncia', 'emergencia', 'acusaci', 'acusan', 'asesin', 'parricid', 'muerte', 'politic', 'presidencial', 'electoral', 'eleccion', 'encuest', 'candidat', 'candidatur', 'votacion', 'voto', 'alcald', 'gobernador', 'regidor', 'proselit', 'gobierno', 'ministro', 'congreso', 'keiko', 'ideologi', 'crimen', 'matanz', 'secuest', 'extors', 'asalto', 'atraco', 'robo', 'robado', 'hurto', 'homicid', 'violencia', 'detenid', 'captur', 'fiscalia', 'policia', 'pnp', 'pelea', 'agresion', 'dispar', 'arma', 'herid', 'acusad', 'amenaz', 'cadaver', 'desaparec'];
const FACEBOOK_CHROME_PATTERNS = [
  /\bpage\s*[·•]\s*government organization\b/i,
  /\blog in\s+forgot account\b/i,
  /\bonline status indicator\s+active\b/i,
  /sorry,\s*we['’]re having trouble playing this video\.?/i,
];

function isFacebookChromeText(value) {
  const text = String(value || '');
  return FACEBOOK_CHROME_PATTERNS.some((pattern) => pattern.test(text));
}

function sectionFor(value) {
  const text = signalText(value);
  if (/\bpresident(?:e|a)\b|presidencia|palacio de gobierno|ejecutivo nacional|congreso|ministro/.test(text)) return 'presidencia';
  if (/electoral|eleccion|encuest|candidat|candidatur|votacion|\bvoto\b|alcald|gobernador|regidor|consejero regional|campana politica|partido politico|proselit|gobierno|keiko|ideologi/.test(text)) return 'politica-local';
  if (/asalto|asaltaron|asaltante|atraco|robo|robado|hurto|delincu|crimen|matanz|secuest|extors/.test(text)) return 'asaltos';
  if (/accidente|incendio|rescate|desaparec|emergencia|evacuaci|muere|muerto|muerta|fallec/.test(text)) return 'emergencias';
  if (/corte de agua|agua potable|luz electrica|alumbrado|pista|via publica|servicio/.test(text)) return 'servicios';
  if (/asesin|parricid|homicid|violencia|detenid|capturad|denuncia|fiscalia|policia|\bpnp\b|pelea|agresion|dispar|arma|herid|acusad/.test(text)) return 'seguridad';
  return 'actualidad';
}

function classify(value, source = {}) {
  const text = signalText(value);
  const sourceSignal = signalText(`${source.name || ''} ${source.facebook_identifier || ''}`);
  const localTerms = ['sullana', 'bellavista', 'marcavelica', 'querecotillo', 'lancones', 'miguel checa', 'salitral', 'piura', 'castilla', 'veintiseis', 'paita', 'sechura', 'chulucanas', 'morropon', 'mallares'];
  const local = source.trust_level === 'TRUSTED_MEDIA' || localTerms.some((term) => text.includes(term) || sourceSignal.includes(term));
  const sensitive = SENSITIVE_TERMS.some((term) => text.includes(term));
  return { status: local ? (sensitive ? 'VERIFY' : 'RELEVANT') : 'NOT_RELEVANT', verification: sensitive ? 'VERIFY' : 'UNVERIFIED', category_slug: sectionFor(value), sensitive };
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
  const categories = [['Actualidad', 'actualidad'], ['Seguridad', 'seguridad'], ['Asaltos', 'asaltos'], ['Servicios', 'servicios'], ['Política local', 'politica-local'], ['Presidencia', 'presidencia'], ['Educación', 'educacion'], ['Deportes', 'deportes'], ['Eventos', 'eventos'], ['Economía', 'economia'], ['Empleo', 'empleo'], ['Comunidad', 'comunidad'], ['Emergencias', 'emergencias'], ['Entretenimiento', 'entretenimiento']];
  for (const category of categories) await dbRun(db, 'INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)', ...category);
  const sources = [
    ['Turismo Sullana MPS', 'https://www.facebook.com/TurismoSullanaMPS/', 'TurismoSullanaMPS', 'OFFICIAL', 0],
    ['Municipalidad Bellavista Oficial', 'https://www.facebook.com/MunicipalidadBellavistaOficial', 'MunicipalidadBellavistaOficial', 'OFFICIAL', 0],
    ['Municipalidad Distrital de Marcavelica', 'https://www.facebook.com/munimarcavelica', 'munimarcavelica', 'OFFICIAL', 0],
    ['Municipalidad Distrital de Querecotillo', 'https://www.facebook.com/MuniQuerecotillo', 'MuniQuerecotillo', 'OFFICIAL', 0],
    ['Municipalidad Distrital de Ignacio Escudero', 'https://www.facebook.com/m.d.ignacio.escudero', 'm.d.ignacio.escudero', 'OFFICIAL', 0],
    ['El Chilalo Noticias', 'https://www.facebook.com/ElChilaloNoticias/', 'ElChilaloNoticias', 'TRUSTED_MEDIA', 1],
    ['Del Chira Noticias', 'https://www.facebook.com/delchiranoticias', 'delchiranoticias', 'TRUSTED_MEDIA', 1],
    ['El Churre Noticias - Sullana', 'https://www.facebook.com/elchurrenoticiasoficialsullana', 'elchurrenoticiasoficialsullana', 'TRUSTED_MEDIA', 1],
    ['Municipalidad Provincial de Sullana', 'https://www.facebook.com/MuniSullana/', 'MuniSullana', 'OFFICIAL', 1],
    ['Municipalidad Provincial de Piura', 'https://www.facebook.com/MuniPiura/', 'MuniPiura', 'OFFICIAL', 1],
    ['Gobierno Regional Piura', 'https://www.facebook.com/GobiernoRegionalPiura/', 'GobiernoRegionalPiura', 'OFFICIAL', 1],
    ['Municipalidad Distrital de Castilla - Piura', 'https://www.facebook.com/MuniCastillaPiura/', 'MuniCastillaPiura', 'OFFICIAL', 1],
    ['Municipalidad Distrital de Veintiséis de Octubre', 'https://www.facebook.com/MunicipioVeintiseisDeOctubre/', 'MunicipioVeintiseisDeOctubre', 'OFFICIAL', 1],
  ];
  for (const source of sources) await dbRun(db, 'INSERT OR IGNORE INTO sources (name, facebook_url, facebook_identifier, trust_level, enabled, auto_draft, auto_publish) VALUES (?, ?, ?, ?, ?, 1, 0)', ...source);
  await dbRun(db, `UPDATE sources SET facebook_url=?, facebook_identifier=?, enabled=1, pause_reason='NONE', last_checked_at=NULL
    WHERE facebook_identifier=? AND pause_reason='SCRAPER_ERROR'`, 'https://www.facebook.com/MuniCastillaPiura/', 'MuniCastillaPiura', 'muni.castilla.3');
  await dbRun(db, "UPDATE sources SET pause_reason='SCRAPER_ERROR' WHERE enabled=0 AND trust_level='TRUSTED_MEDIA' AND last_success_at IS NULL AND pause_reason='NONE'");
}

function adSlot(env, position) {
  const network = String(env.AD_NETWORK || '').toLowerCase();
  if (!network || network === 'none') return '';
  return `<aside class="ad" data-ad-network="${esc(network)}" aria-label="Espacio publicitario"><span>Publicidad</span><small>${esc(position)}</small></aside>`;
}

function layout(env, request, title, description, body, extra = '', canonicalOverride = '') {
  const origin = canonicalOverride || originOf(request);
  const siteOrigin = originOf(request);
  const ga = String(env.GA4_MEASUREMENT_ID || '').replace(/[^A-Za-z0-9_-]/g, '');
  const ogImage = `${siteOrigin}/og-default.svg`;
  const analytics = ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});</script>` : '';
  const monetagTag = new URL(request.url).pathname.startsWith('/admin') ? '' : MONETAG_AD_TAG;
  const siteSchema = JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Sullana Noticias', url: siteOrigin, logo: ogImage },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Sullana Noticias', url: siteOrigin, inLanguage: 'es-PE' },
  ]);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}">${MONETAG_SITE_VERIFICATION}<link rel="canonical" href="${esc(origin)}"><link rel="alternate" type="application/rss+xml" title="Sullana Noticias RSS" href="${esc(`${siteOrigin}/rss.xml`)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Sullana Noticias"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin)}"><meta property="og:image" content="${esc(ogImage)}"><meta property="og:locale" content="es_PE"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(ogImage)}"><script type="application/ld+json">${siteSchema}</script><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%23e86f42'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-family='Arial' font-size='22' font-weight='700' fill='white'%3ESN%3C/text%3E%3C/svg%3E"><style>${STYLE}${RESPONSIVE_LAYOUT_STYLE}</style>${analytics}${monetagTag}${extra}</head><body><a class="skip" href="#contenido">Saltar al contenido</a><header class="header"><div class="shell header-row"><a class="brand" href="/"><span class="mark">SN</span><span>Sullana<br><strong>Noticias</strong></span></a><nav class="nav" aria-label="Navegación"><a href="/">Inicio</a>${publicSectionLinks()}<a href="/admin">Panel</a></nav></div></header>${adSlot(env, 'header')}<main id="contenido">${body}</main><footer class="footer"><div class="shell"><strong>Sullana Noticias</strong><p>Información local, fuentes identificables y revisión humana.</p><a href="/rss.xml">RSS</a> · <a href="/sitemap.xml">Mapa del sitio</a></div></footer><script>${CLIENT_JS}</script></body></html>`;
}

const CLIENT_JS = `(()=>{const context=()=>({path:location.pathname,referrer:document.referrer||''}),send=(name,metadata={},articleId=null)=>{if(typeof window.gtag==='function')window.gtag('event',name,metadata);fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:name,article_id:articleId,metadata})}).catch(()=>{})};const visit=()=>{if(location.pathname.startsWith('/admin'))return;try{const key='sn_site_visit_'+new Date().toISOString().slice(0,10);if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');send('site_visit',{...context(),scope:'session'})}catch{send('site_visit',{...context(),scope:'session'})}};visit();document.querySelectorAll('[data-event]').forEach(el=>el.addEventListener('click',()=>send(el.dataset.event,context(),el.dataset.articleId?Number(el.dataset.articleId):null)));document.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click',async()=>{const u=b.dataset.url,t=b.dataset.title||document.title;const n=b.dataset.share==='copy'?'copy_link':b.dataset.share+'_share',id=b.dataset.articleId?Number(b.dataset.articleId):null;send('article_share',{...context(),channel:n},id);send(n,context(),id);if(b.dataset.share==='copy'){await navigator.clipboard?.writeText(u);b.textContent='Enlace copiado';setTimeout(()=>b.textContent='Copiar enlace',1800)}else if(b.dataset.share==='whatsapp')window.open('https://wa.me/?text='+encodeURIComponent(t+' '+u),'_blank','noopener');else window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u),'_blank','noopener')}));})();`;

async function articleRows(env, limit = 30) {
  if (!env.DB) return [];
  return dbRows(env.DB, `SELECT a.*, c.name AS category_name, c.slug AS category_slug
    FROM articles a
    JOIN news_drafts d ON d.id=a.draft_id
    LEFT JOIN categories c ON c.id=a.category_id
    WHERE d.editorial_status='PUBLISHED' AND d.verification_status='VERIFIED'
    ORDER BY a.published_at DESC LIMIT ?`, Math.min(Math.max(Number(limit) || 30, 1), 100));
}

const displayDek = (article) => {
  const dek = String(article.dek || '').trim();
  if (dek && dek !== 'Borrador pendiente de revisión editorial.') return dek;
  return String(article.summary || article.body || '').replace(/\s+/g, ' ').trim().slice(0, 220);
};
const displayOriginalDate = (article) => article.original_published_at ? ` · Facebook: ${article.original_published_at}` : '';

function card(article) { return `<article class="card">${imageMarkup(article, 'card-media')}<div class="eyebrow">${esc(article.category_name || 'Actualidad')} · ${esc(article.published_at || 'Sin fecha')}${esc(displayOriginalDate(article))}${article.source_name ? ` · ${esc(article.source_name)}` : ''}</div><h3><a href="/noticias/${encodeURIComponent(article.slug)}">${esc(article.title)}</a></h3><p>${esc(displayDek(article))}</p><a class="button" href="/noticias/${encodeURIComponent(article.slug)}">Leer noticia ↗</a></article>`; }

async function home(env, request) {
  const articles = await articleRows(env);
  const body = `<section class="hero shell"><div class="kicker">Noticias locales · Sullana, Piura</div><h1>Lo que pasa cerca,<br><em>bien contado.</em></h1><p class="lede">Un medio local independiente para seguir servicios, comunidad y actualidad de la provincia.</p><p class="meta">Fuentes públicas + revisión editorial</p></section>${adSlot(env, 'home-top')}<section id="ultimas-noticias" class="shell section home-news"><div class="heading"><div><div class="kicker">01 / Ahora</div><h2>Últimas noticias</h2></div><a href="/categoria/actualidad">Ver todo ↗</a></div><p class="meta"><a href="/categoria/presidencia">Presidencia</a> · <a href="/categoria/politica-local">Política local</a> · <a href="/categoria/asaltos">Asaltos</a> · <a href="/categoria/seguridad">Seguridad</a> · <a href="/categoria/emergencias">Emergencias</a> · <a href="/categoria/servicios">Servicios</a></p>${articles.length ? `<div class="grid">${articles.map(card).join('')}</div>` : '<div class="empty"><strong>El primer despacho está por llegar.</strong><p>Las fuentes públicas se procesan y cada hallazgo pasa por revisión editorial antes de publicarse.</p></div>'}</section><section class="tint"><div class="shell section"><div class="heading"><div><div class="kicker">02 / Criterio</div><h2>Cómo trabajamos</h2></div></div><div class="principles"><div><div class="kicker">01</div><h3>Fuente identificable</h3><p>Cada nota conserva enlace y fecha de la publicación original.</p></div><div><div class="kicker">02</div><h3>Redacción propia</h3><p>No copiamos textos ni inventamos datos.</p></div><div><div class="kicker">03</div><h3>Revisión humana</h3><p>Accidentes, denuncias y emergencias no se autopublican.</p></div></div></div></section>`;
  return html(layout(env, request, 'Sullana Noticias · Actualidad local', 'Noticias locales de Sullana, Piura: actualidad, servicios, comunidad y agenda.', body.replace('<h2>Últimas noticias</h2>', `<h2>Últimas noticias <span style="font:700 12px system-ui;color:var(--accent)">(${articles.length})</span></h2>`)), 200, { 'cache-control': 'private, no-store' });
}

async function category(env, request, slug) {
  const category = env.DB ? await dbFirst(env.DB, 'SELECT * FROM categories WHERE slug=?', slug) : null;
  const articles = category ? (await articleRows(env, 100)).filter((article) => article.category_slug === slug) : [];
  if (env.DB) await dbRun(env.DB, 'INSERT INTO events (event_name,article_id,metadata_json) VALUES (?,?,?)', 'category_view', null, JSON.stringify({ path: new URL(request.url).pathname, category: slug, referrer: request.headers.get('referer') || '' }));
  const title = category?.name || 'Actualidad';
  const body = `<section class="shell section"><div class="kicker">Archivo local</div><h1>${esc(title)}</h1><p class="lede">Noticias y publicaciones editoriales de ${esc(title.toLowerCase())} en Sullana y la provincia.</p></section><section class="shell section"><div class="grid">${articles.length ? articles.map(card).join('') : '<div class="empty"><strong>Aún no hay publicaciones.</strong><p>Los artículos aprobados aparecerán aquí.</p></div>'}</div></section>`;
  return html(layout(env, request, `${title} · Sullana Noticias`, `Noticias de ${title.toLowerCase()} en Sullana, Piura.`, body, '', `${originOf(request)}/categoria/${encodeURIComponent(slug)}`), 200, { 'cache-control': 'private, no-store' });
}

async function search(env, request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 80) || '';
  const pattern = `%${query}%`;
  const articles = env.DB && query ? await dbRows(env.DB, `SELECT a.*, c.name AS category_name, c.slug AS category_slug
    FROM articles a
    JOIN news_drafts d ON d.id=a.draft_id
    LEFT JOIN categories c ON c.id=a.category_id
    WHERE d.editorial_status='PUBLISHED' AND d.verification_status='VERIFIED'
      AND (lower(a.title) LIKE lower(?) OR lower(a.dek) LIKE lower(?) OR lower(a.body) LIKE lower(?))
    ORDER BY a.published_at DESC LIMIT 30`, pattern, pattern, pattern) : [];
  if (env.DB && query) await dbRun(env.DB, 'INSERT INTO events (event_name,article_id,metadata_json) VALUES (?,?,?)', 'search', null, JSON.stringify({ path: new URL(request.url).pathname, query_length: query.length, results: articles.length, referrer: request.headers.get('referer') || '' }));
  const body = `<section class="shell section"><div class="kicker">Archivo local</div><h1>Buscar</h1><form class="search-form" action="/buscar" method="get"><label for="search-query">Término</label><input id="search-query" name="q" value="${esc(query)}" maxlength="80" required><button class="button dark" type="submit">Buscar</button></form>${query ? `<p class="meta">Resultados para “${esc(query)}”</p><div class="grid">${articles.length ? articles.map(card).join('') : '<div class="empty"><strong>No encontramos publicaciones.</strong><p>Prueba con otro término local.</p></div>'}</div>` : '<p class="lede">Busca artículos publicados de Sullana y la provincia.</p>'}</section>`;
  return html(layout(env, request, `Buscar${query ? ` · ${query}` : ''} · Sullana Noticias`, 'Busca noticias locales de Sullana, Piura.', body), 200, { 'cache-control': 'private, no-store' });
}

async function article(env, request, slug) {
  const item = env.DB ? await dbFirst(env.DB, `SELECT a.*, c.name AS category_name
    FROM articles a
    JOIN news_drafts d ON d.id=a.draft_id
    LEFT JOIN categories c ON c.id=a.category_id
    WHERE a.slug=? AND d.editorial_status='PUBLISHED' AND d.verification_status='VERIFIED'`, slug) : null;
  if (!item) return html(layout(env, request, 'Noticia no encontrada', 'La noticia solicitada no está disponible.', '<section class="shell section"><h1>Noticia no encontrada</h1><p>Puede haber sido retirada o aún está en revisión.</p><a class="button dark" href="/">Volver al inicio</a></section>'), 404);
  const canonical = `${originOf(request)}/noticias/${encodeURIComponent(item.slug)}`;
  const ogImage = featuredImage(item)?.url || `${originOf(request)}/og-default.svg`;
  const dek = displayDek(item);
  const articleSchema = [
    { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: item.title, description: item.meta_description || dek, image: [ogImage], datePublished: item.published_at, dateModified: item.modified_at, mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Sullana Noticias' }, publisher: { '@type': 'Organization', name: 'Sullana Noticias' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: originOf(request) }, { '@type': 'ListItem', position: 2, name: item.category_name || 'Actualidad', item: `${originOf(request)}/categoria/actualidad` }, { '@type': 'ListItem', position: 3, name: item.title, item: canonical }] },
  ];
  const seoKeywords = Array.from(new Set(`${item.keywords || ''}, Sullana, Piura, ${item.category_name || 'Actualidad'}`.split(',').map((keyword) => keyword.trim()).filter(Boolean))).join(', ');
  Object.assign(articleSchema[0], { articleSection: item.category_name || 'Actualidad', keywords: seoKeywords, inLanguage: 'es-PE', isAccessibleForFree: true });
  articleSchema[0].author.url = originOf(request);
  articleSchema[0].publisher.url = originOf(request);
  const extra = `<link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(item.title)}"><meta property="og:description" content="${esc(item.meta_description || dek)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(ogImage)}"><meta property="article:published_time" content="${esc(item.published_at)}"><meta property="article:modified_time" content="${esc(item.modified_at)}"><script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;
  const body = `<article class="shell article">${imageMarkup(item, 'article-media')}<div class="eyebrow">${esc(item.category_name || 'Actualidad')} · ${esc(item.published_at || '')}${esc(displayOriginalDate(item))}</div><h1>${esc(item.title)}</h1><p class="dek">${esc(dek)}</p><div class="source">Fuente: <a href="${esc(item.source_url)}" data-event="source_click" data-article-id="${item.id}" rel="nofollow noopener" target="_blank">${esc(item.source_name)}</a>${item.original_published_at ? ` · fecha original: ${esc(item.original_published_at)}` : ''} · <a href="${esc(item.original_post_url)}" data-event="source_click" data-article-id="${item.id}" rel="nofollow noopener" target="_blank">publicación original</a></div>${adSlot(env, 'article-body')}<div class="body">${esc(item.body || item.summary).replaceAll('\n','<br>')}</div><div class="share"><strong>Compartir</strong><button data-share="whatsapp" data-article-id="${item.id}" data-url="${esc(canonical)}" data-title="${esc(item.title)}">WhatsApp</button><button data-share="facebook" data-article-id="${item.id}" data-url="${esc(canonical)}">Facebook</button><button data-share="copy" data-article-id="${item.id}" data-url="${esc(canonical)}">Copiar enlace</button></div></article>`;
  if (env.DB) {
    await dbRun(env.DB, 'UPDATE articles SET view_count=view_count+1 WHERE id=?', item.id);
    await dbRun(env.DB, 'INSERT INTO events (event_name,article_id,metadata_json) VALUES (?,?,?)', 'article_view', item.id, JSON.stringify({ path: new URL(request.url).pathname, referrer: request.headers.get('referer') || '' }));
  }
  const articleExtra = extra.replace(`<link rel="canonical" href="${esc(canonical)}">`, '').replace(`<meta property="og:url" content="${esc(canonical)}">`, '');
  return html(layout(env, request, item.meta_title || `${item.title} · Sullana Noticias`, item.meta_description || item.dek, body, articleExtra, canonical), 200, { 'cache-control': 'private, no-store' });
}

async function dashboard(env) {
  if (!env.DB) return { database: 'MISSING' };
  const count = async (table, where = '') => (await dbFirst(env.DB, `SELECT COUNT(*) AS total FROM ${table} ${where}`))?.total || 0;
  const today = "date(created_at)=date('now')";
  const lastScrape = await dbFirst(env.DB, 'SELECT * FROM scrape_runs ORDER BY started_at DESC LIMIT 1');
  return {
    visits_today: await count('events', `WHERE event_name='article_view' AND ${today}`),
    sessions_today: await count('events', `WHERE event_name='site_visit' AND ${today}`),
    articles_today: await count('articles', "WHERE date(published_at)=date('now')"),
    sources_enabled: await count('sources', 'WHERE enabled=1'),
    sources_checked_today: await count('sources', "WHERE date(last_checked_at)=date('now')"),
    posts_detected: await count('raw_posts'),
    drafts: await count('news_drafts', "WHERE editorial_status='DRAFT'"),
    published: await count('articles'),
    last_scrape: lastScrape,
    analytics: {
      shares_today: await count('events', `WHERE event_name IN ('article_share','whatsapp_share','facebook_share','copy_link') AND ${today}`),
      top_articles: await dbRows(env.DB, 'SELECT title, view_count FROM articles ORDER BY view_count DESC, published_at DESC LIMIT 5'),
    },
    traffic: {
      social_today: await count('events', `WHERE event_name='article_view' AND ${today} AND (lower(metadata_json) LIKE '%facebook%' OR lower(metadata_json) LIKE '%whatsapp%' OR lower(metadata_json) LIKE '%instagram%' OR lower(metadata_json) LIKE '%tiktok%')`),
      google_today: await count('events', `WHERE event_name='article_view' AND ${today} AND (lower(metadata_json) LIKE '%google.%' OR lower(metadata_json) LIKE '%google/')`),
    },
    monetization: { network: String(env.AD_NETWORK || 'PENDING_EXTERNAL'), configured: Boolean(env.AD_SCRIPT_URL || env.AD_ZONE_ID), revenue: 'PENDING_EXTERNAL' },
  };
}

async function createDraft(db, raw) {
  const source = await dbFirst(db, 'SELECT * FROM sources WHERE id=?', raw.source_id);
  const check = classify(raw.text, source);
  const category = await dbFirst(db, 'SELECT * FROM categories WHERE slug=?', check.category_slug) || await dbFirst(db, "SELECT * FROM categories WHERE slug='actualidad'");
  if (!source || !category) throw new Error('SOURCE_OR_CATEGORY_NOT_FOUND');
  const title = titleFrom(raw.text);
  const editorial = buildEditorialCopy(raw.text, source.name);
  let slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'noticia-local';
  if (await dbFirst(db, 'SELECT id FROM news_drafts WHERE slug=? UNION SELECT id FROM articles WHERE slug=?', slug, slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const verification = check.sensitive || source.trust_level !== 'OFFICIAL' ? 'VERIFY' : 'UNVERIFIED';
  const result = await dbRun(db, 'INSERT INTO news_drafts (raw_post_id,category_id,title,dek,summary,body,keywords,meta_title,meta_description,slug,source_name,source_url,original_post_url,original_published_at,image_type,image_url,media_json,verification_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', raw.id, category.id, title, editorial.summary, editorial.summary, editorial.body, 'Sullana, Piura, actualidad local', title, editorial.metaDescription, slug, source.name, source.facebook_url, raw.post_url, raw.published_at || null, raw.image_url ? 'SOURCE_IMAGE' : 'NO_IMAGE', raw.image_url || null, raw.media_json || '[]', verification);
  await dbRun(db, 'UPDATE raw_posts SET processing_status=?,verification_status=? WHERE id=?', 'DRAFTED', verification, raw.id);
  return { id: result.meta?.last_row_id, verification_status: verification };
}

async function refreshImprovedRawPost(db, raw, source, post, hash, media, image) {
  const nextText = String(post.text || '').trim();
  const previousText = String(raw.text || '').trim();
  let previousMedia = [];
  try { previousMedia = JSON.parse(raw.media_json || '[]'); } catch { previousMedia = []; }
  const betterText = nextText.length > previousText.length;
  const betterMedia = media.length > (Array.isArray(previousMedia) ? previousMedia.length : 0) || (!raw.image_url && image);
  if (!betterText && !betterMedia) return false;
  const mediaToStore = media.length >= (Array.isArray(previousMedia) ? previousMedia.length : 0) ? media : previousMedia;
  const imageToStore = image || raw.image_url || null;

  const hashOwner = await dbFirst(db, 'SELECT id FROM raw_posts WHERE content_hash=? AND id<>?', hash, raw.id);
  const nextHash = hashOwner ? raw.content_hash : hash;
  const draft = await dbFirst(db, 'SELECT * FROM news_drafts WHERE raw_post_id=?', raw.id);
  const article = draft && await dbFirst(db, 'SELECT * FROM articles WHERE draft_id=?', draft.id);
  const previousEditorial = buildEditorialCopy(previousText, source.name);
  const isGenerated = (value, fallback) => {
    const current = String(value || '').trim();
    return current === previousText || current === String(fallback || '').trim();
  };
  const generatedDraft = draft && (
    isGenerated(draft.body, previousEditorial.body) ||
    isGenerated(draft.summary, previousEditorial.summary) ||
    String(draft.dek || '') === 'Borrador pendiente de revisión editorial.'
  );
  const generatedArticle = article && (
    isGenerated(article.body, previousEditorial.body) ||
    isGenerated(article.summary, previousEditorial.summary) ||
    String(article.dek || '') === 'Borrador pendiente de revisión editorial.'
  );

  await dbRun(db, `UPDATE raw_posts SET external_post_id=COALESCE(?,external_post_id), text=?, post_url=?, image_url=?, media_json=?, published_at=COALESCE(?,published_at), fetched_at=?, content_hash=? WHERE id=?`, post.post_id || null, nextText || previousText, post.post_url || raw.post_url, imageToStore, JSON.stringify(mediaToStore), post.published_at || null, now(), nextHash, raw.id);

  if (generatedDraft || generatedArticle) {
    const editorial = buildEditorialCopy(nextText || previousText, source.name);
    if (generatedDraft && editorial.body) {
      await dbRun(db, `UPDATE news_drafts SET dek=?,summary=?,body=?,meta_description=?,original_post_url=?,original_published_at=COALESCE(?,original_published_at),image_type=?,image_url=?,media_json=?,updated_at=? WHERE id=?`, editorial.summary, editorial.summary, editorial.body, editorial.metaDescription, post.post_url || raw.post_url, post.published_at || null, imageToStore ? 'SOURCE_IMAGE' : draft.image_type, imageToStore, JSON.stringify(mediaToStore), now(), draft.id);
    }
    if (generatedArticle && editorial.body) {
      await dbRun(db, `UPDATE articles SET dek=?,summary=?,body=?,meta_description=?,original_post_url=?,original_published_at=COALESCE(?,original_published_at),image_type=?,image_url=?,media_json=?,modified_at=? WHERE draft_id=?`, editorial.summary, editorial.summary, editorial.body, editorial.metaDescription, post.post_url || article.original_post_url, post.published_at || null, imageToStore ? 'SOURCE_IMAGE' : article.image_type, imageToStore, JSON.stringify(mediaToStore), now(), article.draft_id);
    }
  }
  return true;
}

async function refreshUneditedEditorial(db) {
  const rows = await dbRows(db, `SELECT d.id, d.raw_post_id, r.text, s.name AS source_name
      , d.summary AS draft_summary, d.body AS draft_body, a.body AS article_body
    FROM news_drafts d
    JOIN raw_posts r ON r.id=d.raw_post_id
    JOIN sources s ON s.id=r.source_id
    LEFT JOIN articles a ON a.draft_id=d.id
    WHERE (d.summary=r.text AND d.body=r.text)
       OR d.body LIKE '%El mismo reporte agrega que%'
       OR a.body LIKE '%El mismo reporte agrega que%'
       OR r.text LIKE '%see less%'
       OR r.text LIKE '%ver menos%'
       OR d.body LIKE '%see less%'
       OR d.body LIKE '%ver menos%'
       OR a.body LIKE '%see less%'
       OR a.body LIKE '%ver menos%'
    ORDER BY d.id ASC LIMIT 200`);
  let refreshed = 0;
  for (const item of rows) {
    const untouched = String(item.draft_body || '') === String(item.text || '') && String(item.draft_summary || '') === String(item.text || '');
    const legacyDraft = String(item.draft_body || '').includes('El mismo reporte agrega que');
    const legacyArticle = String(item.article_body || '').includes('El mismo reporte agrega que');
    const facebookControl = /\b(?:see less|ver menos)\.?/i.test(`${item.text} ${item.draft_body} ${item.article_body}`);
    if (!untouched && !legacyDraft && !legacyArticle && !facebookControl) continue;
    const editorial = buildEditorialCopy(item.text, item.source_name);
    if (!editorial.body) continue;
    if (untouched || legacyDraft || facebookControl) {
      await dbRun(db, 'UPDATE news_drafts SET dek=?,summary=?,body=?,meta_description=?,updated_at=? WHERE id=?', editorial.summary, editorial.summary, editorial.body, editorial.metaDescription, now(), item.id);
    }
    if (untouched || legacyArticle || facebookControl) {
      await dbRun(db, `UPDATE articles SET dek=?,summary=?,body=?,meta_description=?,modified_at=?
        WHERE draft_id=?${untouched ? ' AND summary=? AND body=?' : ''}`, ...(untouched
        ? [editorial.summary, editorial.summary, editorial.body, editorial.metaDescription, now(), item.id, item.text, item.text]
        : [editorial.summary, editorial.summary, editorial.body, editorial.metaDescription, now(), item.id]));
    }
    refreshed += 1;
  }
  return refreshed;
}

async function refreshDefaultClassifications(db) {
  const rows = await dbRows(db, `SELECT d.id AS draft_id, d.category_id AS current_category_id,
      d.raw_post_id, d.editorial_status, d.verification_status,
      r.text, r.processing_status AS raw_processing_status, s.name AS source_name, s.trust_level
    FROM news_drafts d
    JOIN raw_posts r ON r.id=d.raw_post_id
    JOIN sources s ON s.id=r.source_id
    JOIN categories c ON c.id=d.category_id
    ORDER BY d.id ASC LIMIT 500`);
  let refreshed = 0;
  for (const item of rows) {
    const check = classify(item.text, { name: item.source_name, trust_level: item.trust_level });
    const category = await dbFirst(db, 'SELECT * FROM categories WHERE slug=?', check.category_slug);
    const categoryChanged = category && Number(category.id) !== Number(item.current_category_id);
    const hasFacebookChrome = isFacebookChromeText(item.text);
    const needsSensitiveReview = check.sensitive && (
      item.editorial_status === 'PUBLISHED' ||
      item.verification_status !== 'VERIFY' ||
      item.raw_processing_status === 'PUBLISHED'
    );
    const needsFacebookChromeReview = hasFacebookChrome && (
      item.editorial_status === 'PUBLISHED' ||
      item.verification_status !== 'VERIFY' ||
      item.raw_processing_status === 'PUBLISHED'
    );
    if (!categoryChanged && !needsSensitiveReview && !needsFacebookChromeReview) continue;
    if (categoryChanged) {
      await dbRun(db, 'UPDATE news_drafts SET category_id=?,updated_at=? WHERE id=? AND category_id=?', category.id, now(), item.draft_id, item.current_category_id);
      await dbRun(db, 'UPDATE articles SET category_id=?,modified_at=? WHERE draft_id=? AND category_id=?', category.id, now(), item.draft_id, item.current_category_id);
    }
    if (check.sensitive || hasFacebookChrome) {
      await dbRun(db, `UPDATE news_drafts SET verification_status='VERIFY',
        editorial_status=CASE WHEN editorial_status='PUBLISHED' THEN 'DRAFT' ELSE editorial_status END,
        updated_at=? WHERE id=?`, now(), item.draft_id);
      await dbRun(db, `UPDATE raw_posts SET verification_status='VERIFY',
        processing_status=CASE WHEN processing_status='PUBLISHED' THEN 'DRAFTED' ELSE processing_status END
        WHERE id=?`, item.raw_post_id);
    }
    refreshed += 1;
  }
  return refreshed;
}

const SAFE_BULK_CATEGORIES = new Set(['actualidad', 'servicios', 'educacion', 'deportes', 'eventos', 'economia', 'empleo', 'comunidad', 'entretenimiento']);

function isSafePublication(item) {
  const sourceTrust = String(item.source_trust_level || '');
  const check = classify(item.summary || item.body || item.title, { trust_level: sourceTrust });
  return ['OFFICIAL', 'TRUSTED_MEDIA'].includes(sourceTrust) && SAFE_BULK_CATEGORIES.has(String(item.category_slug || '')) && check.status === 'RELEVANT' && !check.sensitive && !isFacebookChromeText(item.summary || item.body || item.title);
}

async function publishDraftRecord(db, requestOrigin, item) {
  const canonical = `${requestOrigin}/noticias/${item.slug}`;
  const result = await dbRun(db, 'INSERT OR IGNORE INTO articles (draft_id,category_id,title,dek,summary,body,keywords,meta_title,meta_description,slug,canonical_url,source_name,source_url,original_post_url,original_published_at,image_type,image_url,media_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', item.id, item.category_id, item.title, item.dek, item.summary, item.body, item.keywords, item.meta_title, item.meta_description, item.slug, canonical, item.source_name, item.source_url, item.original_post_url, item.original_published_at, item.image_type, item.image_url, item.media_json || '[]');
  const article = result.meta?.changes ? await dbFirst(db, 'SELECT * FROM articles WHERE id=?', result.meta.last_row_id) : await dbFirst(db, 'SELECT * FROM articles WHERE draft_id=?', item.id);
  if (!article) throw new Error('ARTICLE_NOT_CREATED');
  if (result.meta?.changes) {
    await dbRun(db, 'UPDATE news_drafts SET editorial_status=\'PUBLISHED\',verification_status=\'VERIFIED\',updated_at=? WHERE id=?', now(), item.id);
    await dbRun(db, 'UPDATE raw_posts SET processing_status=\'PUBLISHED\',verification_status=\'VERIFIED\' WHERE id=?', item.raw_post_id);
  }
  return { article, created: Boolean(result.meta?.changes) };
}

async function publishSafeDrafts(db, requestOrigin, { recentTrustedOnly = false, eventName = 'bulk_safe_publish' } = {}) {
  const recentFilter = recentTrustedOnly ? " AND s.trust_level='TRUSTED_MEDIA' AND d.created_at >= datetime('now','-2 days')" : '';
  const candidates = await dbRows(db, `SELECT d.*,c.slug AS category_slug,s.trust_level AS source_trust_level FROM news_drafts d LEFT JOIN categories c ON c.id=d.category_id LEFT JOIN raw_posts r ON r.id=d.raw_post_id LEFT JOIN sources s ON s.id=r.source_id WHERE d.editorial_status='DRAFT'${recentFilter} ORDER BY d.updated_at DESC LIMIT 50`);
  let published = 0;
  let alreadyPublished = 0;
  let skipped = 0;
  let failed = 0;
  for (const item of candidates) {
    if (!isSafePublication(item)) { skipped += 1; continue; }
    try {
      const result = await publishDraftRecord(db, requestOrigin, item);
      if (result.created) published += 1; else alreadyPublished += 1;
    } catch (error) {
      failed += 1;
      console.error(eventName, item.id, error.message);
    }
  }
  await dbRun(db, 'INSERT INTO events (event_name,metadata_json) VALUES (?,?)', eventName, JSON.stringify({ candidates: candidates.length, published, already_published: alreadyPublished, skipped, failed }));
  return { candidates: candidates.length, published, already_published: alreadyPublished, skipped, failed };
}

async function persistIngest(env, payload, requestOrigin) {
  const db = env.DB;
  if (!db) return { status: 'ERROR', error: 'DATABASE_NOT_CONFIGURED' };
  const sources = await dbRows(db, "SELECT * FROM sources WHERE enabled=1 ORDER BY id");
  const runId = crypto.randomUUID();
  const started = now();
  const run = await dbRun(db, 'INSERT INTO scrape_runs (run_id,started_at,sources_checked,status) VALUES (?,?,?,?)', runId, started, sources.length, 'RUNNING');
  const insert = 'INSERT OR IGNORE INTO raw_posts (source_id,external_post_id,text,post_url,image_url,media_json,published_at,fetched_at,content_hash,processing_status,verification_status,likes,comments,shares,reactions_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  const adapterErrors = Array.isArray(payload.errors) ? payload.errors : [];
  const failedSourceIds = new Set(adapterErrors.map((error) => Number(error.source_id)).filter(Number.isInteger));
  const failedSourceNames = new Set(adapterErrors.map((error) => String(error.source || '').trim()).filter(Boolean));
  const recoveredSourceIds = new Set();
  let found = 0, fresh = 0, duplicates = 0, errors = adapterErrors.map((error) => `${error.source || 'adapter'}: ${error.message || 'SCRAPER_ERROR'}`);
  for (const post of Array.isArray(payload.posts) ? payload.posts : []) {
    const source = sources.find((item) => item.id === Number(post.source_id) || item.facebook_identifier === post.page_identifier || item.facebook_url === post.source_url);
    if (!source || !post.post_url) continue;
    found += 1;
    if (source.pause_reason === 'SCRAPER_ERROR') recoveredSourceIds.add(Number(source.id));
    const check = classify(post.text, source);
    const hash = await digest(`${post.text || ''}\n${post.post_url}`);
    const media = normalizeMedia(post.media, post.image);
    const image = media.find((item) => item.kind === 'image')?.url || null;
    const result = await dbRun(db, insert, source.id, post.post_id || null, post.text || '', post.post_url, image, JSON.stringify(media), post.published_at || null, now(), hash, check.status, check.verification, post.likes ?? null, post.comments ?? null, post.shares ?? null, JSON.stringify(post.reactions || null));
    if (!result.meta?.changes) {
      duplicates += 1;
      const raw = await dbFirst(db, `SELECT * FROM raw_posts
        WHERE (source_id=? AND external_post_id=? AND external_post_id IS NOT NULL)
           OR post_url=? OR content_hash=? LIMIT 1`, source.id, post.post_id || null, post.post_url, hash);
      if (raw) {
        try { await refreshImprovedRawPost(db, raw, source, post, hash, media, image); } catch (error) { errors.push(`${source.name}: ${error.message}`); }
      }
      if (source.auto_draft && check.status !== 'NOT_RELEVANT' && raw) {
        const existingDraft = await dbFirst(db, 'SELECT id FROM news_drafts WHERE raw_post_id=?', raw.id);
        if (!existingDraft) {
          try { await createDraft(db, raw); } catch (error) { errors.push(`${source.name}: ${error.message}`); }
        }
      }
      continue;
    }
    fresh += 1;
    if (source.auto_draft && check.status !== 'NOT_RELEVANT') {
      try { const raw = await dbFirst(db, 'SELECT * FROM raw_posts WHERE content_hash=?', hash); await createDraft(db, raw); } catch (error) { errors.push(`${source.name}: ${error.message}`); }
    }
  }
  try {
    const refreshed = await refreshUneditedEditorial(db);
    if (refreshed) console.log(`editorial_backfill refreshed=${refreshed}`);
  } catch (error) {
    console.error('editorial_backfill', error.message);
  }
  try {
    const recategorized = await refreshDefaultClassifications(db);
    if (recategorized) console.log(`classification_backfill refreshed=${recategorized}`);
  } catch (error) {
    console.error('classification_backfill', error.message);
  }
  const status = errors.length && !found ? 'ERROR' : errors.length ? 'PARTIAL' : 'SUCCESS';
  await dbRun(db, 'UPDATE scrape_runs SET finished_at=?,posts_found=?,new_posts=?,duplicates=?,errors=?,status=?,error_message=? WHERE id=?', now(), found, fresh, duplicates, errors.length, status, errors.join(' | ') || null, run.meta?.last_row_id);
  for (const source of sources) {
    const failed = failedSourceIds.has(Number(source.id)) || failedSourceNames.has(String(source.name));
    const recovered = recoveredSourceIds.has(Number(source.id)) && !failed;
    if (failed) {
      await dbRun(db, "UPDATE sources SET enabled=0, pause_reason='SCRAPER_ERROR', last_checked_at=? WHERE id=?", now(), source.id);
    } else if (recovered) {
      await dbRun(db, "UPDATE sources SET enabled=1, pause_reason='NONE', last_checked_at=?, last_success_at=? WHERE id=?", now(), now(), source.id);
    } else {
      await dbRun(db, "UPDATE sources SET last_checked_at=?, last_success_at=CASE WHEN ? IN ('SUCCESS','PARTIAL') THEN ? ELSE last_success_at END WHERE id=?", now(), status, now(), source.id);
    }
  }
  let safePublication = null;
  if (payload.publish_safe === true) {
    try {
      safePublication = await publishSafeDrafts(db, requestOrigin, { recentTrustedOnly: false, eventName: 'scheduled_safe_publish' });
    } catch (error) {
      console.error('scheduled_safe_publish', error.message);
      safePublication = { candidates: 0, published: 0, already_published: 0, skipped: 0, failed: 1 };
    }
  }
  return { run_id: runId, status, posts_found: found, new_posts: fresh, duplicates, errors, safe_publication: safePublication };
}

async function adminPage(env, request) {
  const body = `<section class="shell admin"><div class="kicker">Operaciones</div><h1>Panel editorial</h1><p class="lede">Detecta, verifica, redacta y publica con trazabilidad.</p><div id="login" class="admin-card"><h2>Acceso editorial</h2><form id="login-form"><label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label><button class="button dark">Entrar</button><p id="error"></p></form></div><div id="app" class="hidden"><div id="metrics" class="metrics"></div><div class="admin-card"><h2>Analytics</h2><div id="analytics"></div></div><div class="admin-card"><h2>Monetización</h2><div id="monetization"></div></div><div class="admin-card"><h2>Fuentes</h2><div id="sources"></div><button id="ingest" class="button">Revisar ahora</button></div><div class="admin-card"><h2>Posts detectados</h2><div id="raw"></div></div><div class="admin-card"><h2>Borradores</h2><div id="drafts"></div></div></div></section>`;
  const script = String.raw`<script>(()=>{const q=s=>document.querySelector(s),esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"),mediaSummary=v=>{try{const m=JSON.parse(v||"[]"),i=m.filter(x=>x.kind==="image").length,vv=m.filter(x=>x.kind==="video").length;return m.length?"<p>Medios detectados: "+i+" foto(s) · "+vv+" video(s) · "+m.map((x,n)=>{const u=x.url||x.poster||"";return u?"<a href=\""+esc(u)+"\" target=\"_blank\" rel=\"nofollow noopener\">"+(x.kind==="video"?"Video ":"Foto ")+(n+1)+" ↗</a>":""}).join(" · ")+"</p>":""}catch{return""}},api=async(p,o={})=>{const r=await fetch(p,{headers:{"content-type":"application/json",...(o.headers||{})},...o}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||d.error||"REQUEST_FAILED");return d};async function load(){const[d,s,r,w]=await Promise.all([api("/api/admin/dashboard"),api("/api/admin/sources"),api("/api/admin/raw-posts"),api("/api/admin/drafts")]);q("#metrics").innerHTML=[["Visitas hoy",d.visits_today],["Artículos hoy",d.articles_today],["Posts",d.posts_detected],["Borradores",d.drafts]].map(x=>"<div class=\"metric\"><small>"+esc(x[0])+"</small><strong>"+esc(x[1])+"</strong></div>").join("");q("#sources").innerHTML=s.map(x=>"<div class=\"item\"><strong>"+esc(x.name)+"</strong> <span class=\"badge\">"+(x.enabled?"Activa":"Pausada")+"</span><p>"+esc(x.facebook_url)+"</p><button class=\"button\" data-source=\""+x.id+"\" data-enabled=\""+(x.enabled?0:1)+"\">"+(x.enabled?"Pausar":"Activar")+"</button></div>").join("")||"<p>No hay fuentes.</p>";q("#raw").innerHTML=r.map(x=>"<div class=\"item\"><strong>"+esc(x.source_name)+"</strong> <span class=\"badge\">"+esc(x.processing_status)+"</span><p>"+esc((x.text||"").slice(0,180))+"</p>"+mediaSummary(x.media_json)+(!["DRAFTED","PUBLISHED","REJECTED"].includes(x.processing_status)?"<button class=\"button\" data-draft=\""+x.id+"\">Crear borrador</button>":"")+"</div>").join("")||"<p>No hay posts detectados.</p>";q("#drafts").innerHTML=w.map(x=>"<div class=\"item\"><strong>"+esc(x.title)+"</strong> <span class=\"badge "+(x.verification_status==="VERIFY"?"warn":"")+"\">"+esc(x.editorial_status)+" · "+esc(x.verification_status)+"</span><p>"+esc(x.dek)+"<br>Fuente: "+esc(x.source_name)+"</p>"+(x.editorial_status==="DRAFT"?"<button class=\"button dark\" data-publish=\""+x.id+"\">"+(x.verification_status==="VERIFY"?"Confirmar y publicar":"Publicar")+"</button>":"")+"</div>").join("")||"<p>No hay borradores.</p>";document.querySelectorAll("[data-source]").forEach(b=>b.onclick=async()=>{await api("/api/admin/sources/"+b.dataset.source,{method:"PATCH",body:JSON.stringify({enabled:b.dataset.enabled==="1"})});load()});document.querySelectorAll("[data-draft]").forEach(b=>b.onclick=async()=>{await api("/api/admin/raw-posts/"+b.dataset.draft+"/draft",{method:"POST",body:"{}"});load()});document.querySelectorAll("[data-publish]").forEach(b=>b.onclick=async()=>{if(confirm("Confirma revisión editorial y publicación.")){await api("/api/admin/drafts/"+b.dataset.publish+"/publish",{method:"POST",body:JSON.stringify({verified:true})});load()}})}q("#login-form").onsubmit=async e=>{e.preventDefault();try{await api("/api/auth/login",{method:"POST",body:JSON.stringify({password:new FormData(e.target).get("password")})});q("#login").classList.add("hidden");q("#app").classList.remove("hidden");load()}catch(x){q("#error").textContent=x.message}};q("#ingest").onclick=async()=>{try{await api("/api/admin/ingest",{method:"POST"});load()}catch(x){alert(x.message)}};api("/api/admin/session").then(()=>{q("#login").classList.add("hidden");q("#app").classList.remove("hidden");load()}).catch(()=>{})})();</script>`;
  const deferredScript = script
    .replace('<script>(()=>{', '<script>document.addEventListener("DOMContentLoaded",()=>{(()=>{')
    .replace('})();</script>', '})();});</script>');
  const analyticsScript = String.raw`<script>(()=>{const q=s=>document.querySelector(s),esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");const load=async()=>{if(q("#app")?.classList.contains("hidden"))return;try{const d=await fetch("/api/admin/dashboard").then(r=>r.json());q("#analytics").innerHTML="<p><strong>Sesiones registradas hoy:</strong> "+esc(d.sessions_today??0)+" · <strong>Lecturas de artículos:</strong> "+esc(d.visits_today)+" · <strong>Compartidos:</strong> "+esc(d.analytics?.shares_today??0)+"</p>"+(d.analytics?.top_articles||[]).map(x=>"<div class=\"item\"><strong>"+esc(x.title)+"</strong><span class=\"badge\">"+esc(x.view_count)+" vistas</span></div>").join("")||"<p>Aún no hay lecturas registradas.</p>";const m=d.monetization||{};q("#monetization").innerHTML="<p><strong>Red:</strong> "+esc(m.network)+"</p><p><strong>Estado:</strong> "+esc(m.configured?"Configurada por secreto":"PENDING_EXTERNAL")+" · <strong>Ingresos:</strong> "+esc(m.revenue)+"</p>"}catch{}};const timer=setInterval(()=>{load();if(!q("#app")?.classList.contains("hidden"))clearInterval(timer)},500)})();</script>`;
  const kpiScript = String.raw`<script>(()=>{const q=s=>document.querySelector(s),e=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");const load=async()=>{if(q("#app")?.classList.contains("hidden"))return;try{const d=await fetch("/api/admin/dashboard").then(r=>r.json());const m=d.monetization||{},t=d.traffic||{};q("#metrics").innerHTML=[["Sesiones hoy",d.sessions_today??0],["Lecturas hoy",d.visits_today],["Artículos hoy",d.articles_today],["Fuentes revisadas",d.sources_checked_today],["Posts",d.posts_detected],["Publicados",d.published],["Borradores",d.drafts],["Tráfico social",t.social_today],["Tráfico Google",t.google_today],["Ingresos ads",m.revenue]].map(x=>"<div class=\"metric\"><small>"+e(x[0])+"</small><strong>"+e(x[1])+"</strong></div>").join("")}catch{}};setTimeout(load,1200);setTimeout(load,2500)})();</script>`;
  const safePublishScript = String.raw`<script>document.addEventListener("DOMContentLoaded",()=>{const drafts=document.querySelector("#drafts");if(!drafts)return;const api=async()=>{const response=await fetch("/api/admin/drafts/publish-safe",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:true})}),data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.message||data.error||"REQUEST_FAILED");return data};const install=()=>{if(drafts.querySelector("#publish-safe"))return;const panel=document.createElement("div");panel.className="item";panel.innerHTML="<strong>Publicación segura</strong><p>Publica solo borradores relevantes y no sensibles. Se omiten seguridad, asaltos, emergencias, presidencia y denuncias.</p><button id=\"publish-safe\" class=\"button dark\">Publicar borradores no sensibles</button><p id=\"publish-safe-status\" class=\"meta\"></p>";drafts.prepend(panel)};new MutationObserver(install).observe(drafts,{childList:true});install();drafts.addEventListener("click",async event=>{const button=event.target.closest("#publish-safe");if(!button||!confirm("Se publicarán solo borradores locales no sensibles. ¿Confirmas?"))return;button.disabled=true;const status=drafts.querySelector("#publish-safe-status");if(status)status.textContent="Publicando...";try{const data=await api();if(status)status.textContent="Publicadas: "+data.published+" · omitidas para revisión: "+data.skipped+".";window.setTimeout(()=>window.location.reload(),700)}catch(error){if(status)status.textContent=error.message;button.disabled=false}})});</script>`;
  return html(layout(env, request, 'Panel editorial · Sullana Noticias', 'Panel de revisión editorial.', body, `${deferredScript}${analyticsScript}${kpiScript}${safePublishScript}`));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (env.DB) ctx.waitUntil(seed(env.DB).catch((error) => console.error('seed', error)));
      if (url.pathname === '/api/health') {
        const lastScrape = env.DB ? await dbFirst(env.DB, 'SELECT status, started_at, finished_at, posts_found, new_posts, errors FROM scrape_runs ORDER BY started_at DESC LIMIT 1') : null;
        const lastFinished = lastScrape?.finished_at ? Date.parse(lastScrape.finished_at) : NaN;
        return json({ web: 'OK', database: env.DB ? 'OK' : 'MISSING', scraper: env.INGEST_TOKEN ? 'PLAYWRIGHT_ADAPTER' : 'NOT_CONFIGURED', meta_graph: 'PENDING_EXTERNAL', last_scrape: lastScrape, last_scrape_minutes: Number.isFinite(lastFinished) ? Math.max(0, Math.round((Date.now() - lastFinished) / 60000)) : null });
      }
      if (url.pathname === '/api/ingest-sources' && request.method === 'GET') {
        if (!await authorizedIngest(request, env)) return json({ error: 'INGEST_AUTH_REQUIRED' }, 401);
        if (!env.DB) return json({ error: 'DATABASE_NOT_CONFIGURED' }, 503);
        await seed(env.DB);
        const sources = await dbRows(env.DB, `SELECT id, name, facebook_url, facebook_identifier
          FROM sources
          WHERE enabled=1
             OR (enabled=0 AND pause_reason='SCRAPER_ERROR'
                 AND (last_checked_at IS NULL OR datetime(last_checked_at) <= datetime('now','-30 minutes')))
          ORDER BY id`);
        return json({ sources }, 200, { 'cache-control': 'no-store' });
      }
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await bodyJson(request);
        if (!env.ADMIN_PASSWORD) return json({ error: 'ADMIN_PASSWORD_NOT_CONFIGURED' }, 503);
        const expected = await hmac(String(env.ADMIN_PASSWORD), String(env.ADMIN_PASSWORD));
        const supplied = await hmac(String(body.password || ''), String(env.ADMIN_PASSWORD));
        if (!sameBytes(expected, supplied)) return json({ error: 'INVALID_CREDENTIALS' }, 401);
        return json({ ok: true }, 200, { 'set-cookie': `sullana_session=${await adminCookie(env)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800` });
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') return json({ ok: true }, 200, { 'set-cookie': 'sullana_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
      if (url.pathname === '/api/events' && request.method === 'POST' && env.DB) { const event = await bodyJson(request); const allowed = new Set(['article_view','article_share','share_click','copy_link','whatsapp_share','facebook_share','source_click','category_view','search','newsletter_click','editor_login','site_visit']); if (!allowed.has(String(event.event_name))) return json({ error:'EVENT_NOT_ALLOWED' },400); await dbRun(env.DB,'INSERT INTO events (event_name,article_id,metadata_json) VALUES (?,?,?)',String(event.event_name),Number.isInteger(event.article_id)?event.article_id:null,JSON.stringify(event.metadata||{})); return json({ok:true},202); }
      if (url.pathname === '/api/ingest' && request.method === 'POST') { if (!await authorizedIngest(request, env)) return json({ error:'INGEST_AUTH_REQUIRED' },401); if (env.DB) await seed(env.DB); return json(await persistIngest(env, await bodyJson(request), originOf(request))); }
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
        if (source && request.method === 'PATCH') { const body=await bodyJson(request); const enabled=body.enabled===undefined?null:(body.enabled?1:0); const pauseReason=body.enabled===undefined?null:(body.enabled?'NONE':'MANUAL'); await dbRun(env.DB,'UPDATE sources SET enabled=COALESCE(?,enabled),pause_reason=COALESCE(?,pause_reason),trust_level=COALESCE(?,trust_level),auto_draft=COALESCE(?,auto_draft),auto_publish=0 WHERE id=?',enabled,pauseReason,body.trust_level||null,body.auto_draft===undefined?null:(body.auto_draft?1:0),Number(source[1])); return json(await dbFirst(env.DB,'SELECT * FROM sources WHERE id=?',Number(source[1]))); }
        const rawDraft = url.pathname.match(/^\/api\/admin\/raw-posts\/(\d+)\/draft$/);
        if (rawDraft && request.method === 'POST') { const raw=await dbFirst(env.DB,'SELECT * FROM raw_posts WHERE id=?',Number(rawDraft[1])); if(!raw)return json({error:'RAW_POST_NOT_FOUND'},404); const existing=await dbFirst(env.DB,'SELECT * FROM news_drafts WHERE raw_post_id=?',raw.id); return json(existing||await createDraft(env.DB,raw),existing?200:201); }
        const draft = url.pathname.match(/^\/api\/admin\/drafts\/(\d+)$/);
        if (draft && request.method === 'PUT') { const body=await bodyJson(request); await dbRun(env.DB,'UPDATE news_drafts SET title=?,dek=?,body=?,category_id=COALESCE((SELECT id FROM categories WHERE slug=?),category_id),meta_title=?,meta_description=?,updated_at=? WHERE id=?',String(body.title||''),String(body.dek||''),String(body.body||''),String(body.category_slug||'actualidad'),String(body.meta_title||body.title||''),String(body.meta_description||body.dek||''),now(),Number(draft[1])); return json(await dbFirst(env.DB,'SELECT * FROM news_drafts WHERE id=?',Number(draft[1]))); }
        if (url.pathname === '/api/admin/drafts/publish-safe' && request.method === 'POST') {
          const body = await bodyJson(request);
          if (body.confirm !== true) return json({ error: 'CONFIRMATION_REQUIRED', message: 'Confirma la publicación segura desde el panel.' }, 400);
          return json({ ok: true, ...(await publishSafeDrafts(env.DB, originOf(request))) });
        }
        const publish = url.pathname.match(/^\/api\/admin\/drafts\/(\d+)\/publish$/);
        if (publish && request.method === 'POST') { const body=await bodyJson(request); const item=await dbFirst(env.DB,'SELECT * FROM news_drafts WHERE id=?',Number(publish[1])); if(!item)return json({error:'DRAFT_NOT_FOUND'},404); if(item.verification_status==='VERIFY'&&body.verified!==true)return json({error:'VERIFICATION_REQUIRED'},409); const result=await publishDraftRecord(env.DB, originOf(request), item); return json({article:result.article},result.created?201:200); }
        return json({error:'NOT_FOUND'},404);
      }
      if (url.pathname === '/sitemap.xml') {
        const articles = await articleRows(env, 100);
        const base = originOf(request);
        const home = `<url><loc>${esc(`${base}/`)}</loc></url>`;
        const categories = PUBLIC_SECTIONS.map(([slug]) => `<url><loc>${esc(`${base}/categoria/${slug}`)}</loc></url>`).join('');
        const articleUrls = articles.map((item) => {
          const lastmod = isoDate(item.modified_at || item.published_at);
          return `<url><loc>${esc(`${base}/noticias/${item.slug}`)}</loc>${lastmod ? `<lastmod>${esc(lastmod)}</lastmod>` : ''}</url>`;
        }).join('');
        return text(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${home}${categories}${articleUrls}</urlset>`, 'application/xml; charset=utf-8', 200, { 'cache-control': 'public,max-age=300' });
      }
      if (url.pathname === '/news-sitemap.xml') {
        const articles = env.DB ? await dbRows(env.DB, `SELECT a.slug,a.title,a.published_at
          FROM articles a
          JOIN news_drafts d ON d.id=a.draft_id
          WHERE d.editorial_status='PUBLISHED' AND d.verification_status='VERIFIED'
            AND datetime(a.published_at) >= datetime('now','-2 days')
          ORDER BY a.published_at DESC LIMIT 1000`) : [];
        const base = originOf(request);
        const entries = articles.map((item) => {
          const published = isoDate(item.published_at);
          if (!published) return '';
          return `<url><loc>${esc(`${base}/noticias/${item.slug}`)}</loc><news:news><news:publication><news:name>Sullana Noticias</news:name><news:language>es</news:language></news:publication><news:publication_date>${esc(published)}</news:publication_date><news:title>${esc(item.title)}</news:title></news:news></url>`;
        }).join('');
        return text(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}</urlset>`, 'application/xml; charset=utf-8', 200, { 'cache-control': 'public,max-age=300' });
      }
      if (url.pathname === '/rss.xml') {
        const articles = await articleRows(env, 30);
        const base = originOf(request);
        const buildDate = rfc822Date(articles[0]?.modified_at || articles[0]?.published_at) || new Date().toUTCString();
        const items = articles.map((item) => {
          const link = `${base}/noticias/${item.slug}`;
          const pubDate = rfc822Date(item.published_at || item.modified_at);
          const source = item.source_name ? `<source url="${esc(item.source_url || base)}">${esc(item.source_name)}</source>` : '';
          const category = item.category_name ? `<category>${esc(item.category_name)}</category>` : '';
          return `<item><title>${esc(item.title)}</title><link>${esc(link)}</link><guid isPermaLink="true">${esc(link)}</guid>${pubDate ? `<pubDate>${esc(pubDate)}</pubDate>` : ''}${category}${source}<description>${esc(item.dek || item.summary)}</description></item>`;
        }).join('');
        return text(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Sullana Noticias</title><link>${esc(base)}</link><atom:link href="${esc(`${base}/rss.xml`)}" rel="self" type="application/rss+xml"/><description>Noticias locales de Sullana, Piura.</description><lastBuildDate>${esc(buildDate)}</lastBuildDate>${items}</channel></rss>`, 'application/rss+xml; charset=utf-8', 200, { 'cache-control': 'public,max-age=300' });
      }
      if (url.pathname === '/og-default.svg') return text(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#18312d"/><circle cx="1030" cy="100" r="260" fill="#e86f42"/><text x="90" y="250" fill="#fffefa" font-family="Georgia,serif" font-size="92" font-weight="700">Sullana</text><text x="90" y="355" fill="#fffefa" font-family="Georgia,serif" font-size="92" font-weight="700">Noticias</text><text x="94" y="425" fill="#d3dfd7" font-family="Arial,sans-serif" font-size="28">Información local · Piura</text></svg>`, 'image/svg+xml; charset=utf-8', 200, {'cache-control':'public,max-age=86400'});
      if (url.pathname === '/robots.txt') return text(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${originOf(request)}/sitemap.xml\nSitemap: ${originOf(request)}/news-sitemap.xml\n`);
      if (url.pathname === '/admin') return adminPage(env, request);
      if (url.pathname.startsWith('/noticias/')) return article(env, request, decodeURIComponent(url.pathname.slice('/noticias/'.length)));
      if (url.pathname === '/buscar') return search(env, request);
      if (url.pathname.startsWith('/categoria/')) return category(env, request, decodeURIComponent(url.pathname.slice('/categoria/'.length)));
      return home(env, request);
    } catch (error) { console.error(error); return json({ error:'INTERNAL_ERROR' },500); }
  },
};

export { classify, isFacebookChromeText, sectionFor };
