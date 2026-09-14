import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { contentHash, getCategory, openDatabase, uniqueSlug } from '../src/db.js';

const now = () => new Date().toISOString();
const terms = ['sullana', 'bellavista', 'marcavelica', 'querecotillo', 'lancones', 'miguel checa', 'salitral', 'piura', 'mallares'];
const signalText = (value) => String(value || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[01345]/g, (character) => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's' })[character]);
const sensitive = ['accidente', 'delito', 'fallec', 'muere', 'muerto', 'muerta', 'denuncia', 'emergencia', 'acusaci', 'acusan', 'asesin', 'muerte', 'politica', 'crimen', 'matanz', 'secuest', 'extors', 'asalto', 'atraco', 'robo', 'robado', 'hurto', 'homicid', 'violencia', 'detenid', 'captur', 'fiscalia', 'policia', 'pnp', 'pelea', 'agresion', 'dispar', 'arma', 'herid', 'acusad', 'amenaz', 'cadaver', 'desaparec'];
const sectionFor = (text) => {
  const normalized = signalText(text);
  if (/\bpresident(?:e|a)\b|presidencia|palacio de gobierno|ejecutivo nacional|congreso|ministro/.test(normalized)) return 'presidencia';
  if (/asalto|asaltaron|asaltante|atraco|robo|robado|hurto|delincu|crimen|matanz|secuest|extors/.test(normalized)) return 'asaltos';
  if (/accidente|incendio|rescate|desaparec|emergencia|evacuaci/.test(normalized)) return 'emergencias';
  if (/corte de agua|agua potable|luz electrica|alumbrado|pista|via publica|servicio/.test(normalized)) return 'servicios';
  if (/asesin|homicid|violencia|detenid|capturad|denuncia|fiscalia|policia|\bpnp\b|pelea|agresion|dispar|arma|herid|acusad/.test(normalized)) return 'seguridad';
  return 'actualidad';
};
const classify = (text, source = {}) => {
  const normalized = signalText(text);
  const local = source.trust_level === 'TRUSTED_MEDIA' || terms.some((term) => normalized.includes(term));
  const verify = sensitive.some((term) => normalized.includes(term));
  return { status: local ? (verify ? 'VERIFY' : 'RELEVANT') : 'NOT_RELEVANT', verification: verify ? 'VERIFY' : 'UNVERIFIED', category_slug: sectionFor(text) };
};
const titleFrom = (text) => (String(text || '').replace(/\s+/g, ' ').trim().split(/[.!?]\s/)[0] || 'Nueva publicación local').slice(0, 100);
const publicMediaUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const allowed = ['facebook.com', 'fbcdn.net', 'fbsbx.com'].some((domain) => host === domain || host.endsWith(`.${domain}`));
    return allowed && ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
};
const normalizeMedia = (value, fallbackImage = null) => {
  const output = [];
  const seen = new Set();
  for (const item of Array.isArray(value) ? value.slice(0, 8) : []) {
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

const db = openDatabase();
const sources = db.prepare("SELECT * FROM sources WHERE enabled = 1 OR pause_reason = 'SCRAPER_ERROR' ORDER BY id").all();
if (!sources.length) {
  console.error('No hay fuentes activas. Activa una fuente después de verificarla.');
  db.close();
  process.exitCode = 2;
} else {
  const runId = crypto.randomUUID();
  const run = db.prepare('INSERT INTO scrape_runs (run_id, started_at, sources_checked, status) VALUES (?, ?, ?, ?)').run(runId, now(), sources.length, 'RUNNING');
  const result = spawnSync('python3', ['services/facebook-ingestor/run.py'], { input: JSON.stringify({ sources, page_limit: Number(process.env.FACEBOOK_PAGE_LIMIT || 8), timeout: Number(process.env.SCRAPER_TIMEOUT_SECONDS || 25), retries: Number(process.env.SCRAPER_RETRIES || 2), min_interval: Number(process.env.SCRAPER_MIN_INTERVAL_SECONDS || 30), scroll_limit: Number(process.env.SCRAPER_SCROLL_LIMIT || 3) }), encoding: 'utf8', env: process.env });
  let payload = {};
  try { payload = JSON.parse(result.stdout || '{}'); } catch { payload = { errors: [{ source: 'runner', message: result.stderr || 'Invalid JSON' }] }; }
  const posts = payload.posts || [];
  const errors = payload.errors || [];
  const failedSourceIds = new Set(errors.map((error) => Number(error.source_id)).filter(Number.isInteger));
  const failedSourceNames = new Set(errors.map((error) => String(error.source || '').trim()).filter(Boolean));
  const recoveredSourceIds = new Set();
  let newPosts = 0;
  let duplicates = 0;
  const insert = db.prepare('INSERT OR IGNORE INTO raw_posts (source_id, external_post_id, text, post_url, image_url, media_json, published_at, fetched_at, content_hash, processing_status, verification_status, likes, comments, shares, reactions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const post of posts) {
    const source = sources.find((item) => item.id === post.source_id);
    if (!source || !post.post_url) continue;
    if (source.pause_reason === 'SCRAPER_ERROR') recoveredSourceIds.add(Number(source.id));
    const check = classify(post.text, source);
    const hash = contentHash(post.text, post.post_url);
    const media = normalizeMedia(post.media, post.image);
    const image = media.find((item) => item.kind === 'image')?.url || null;
    const outcome = insert.run(source.id, post.post_id || null, post.text || '', post.post_url, image, JSON.stringify(media), post.published_at || null, now(), hash, check.status, check.verification, post.likes ?? null, post.comments ?? null, post.shares ?? null, JSON.stringify(post.reactions || null));
    if (!outcome.changes) {
      duplicates += 1;
      if (source.auto_draft && check.status !== 'NOT_RELEVANT') {
        const raw = db.prepare('SELECT * FROM raw_posts WHERE content_hash = ?').get(hash);
        const existingDraft = raw && db.prepare('SELECT id FROM news_drafts WHERE raw_post_id = ?').get(raw.id);
        if (raw && !existingDraft) {
          const title = titleFrom(raw.text);
          const sourceVerification = check.verification === 'VERIFY' || source.trust_level !== 'OFFICIAL' ? 'VERIFY' : 'UNVERIFIED';
          const category = getCategory(db, check.category_slug);
          db.prepare('INSERT INTO news_drafts (raw_post_id, category_id, title, dek, summary, body, keywords, meta_title, meta_description, slug, source_name, source_url, original_post_url, original_published_at, image_type, image_url, media_json, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(raw.id, category.id, title, 'Borrador pendiente de revisión editorial.', raw.text, raw.text, 'Sullana, Piura, actualidad local', title, raw.text.slice(0, 155), uniqueSlug(db, title), source.name, source.facebook_url, raw.post_url, raw.published_at, raw.image_url ? 'SOURCE_IMAGE' : 'NO_IMAGE', raw.image_url || null, raw.media_json || '[]', sourceVerification);
          db.prepare('UPDATE raw_posts SET processing_status = ?, verification_status = ? WHERE id = ?').run('DRAFTED', sourceVerification, raw.id);
        }
      }
      continue;
    }
    newPosts += 1;
    if (source.auto_draft && check.status !== 'NOT_RELEVANT') {
      const raw = db.prepare('SELECT * FROM raw_posts WHERE content_hash = ?').get(hash);
      const title = titleFrom(raw.text);
      const sourceVerification = check.verification === 'VERIFY' || source.trust_level !== 'OFFICIAL' ? 'VERIFY' : 'UNVERIFIED';
      const category = getCategory(db, check.category_slug);
      db.prepare('INSERT INTO news_drafts (raw_post_id, category_id, title, dek, summary, body, keywords, meta_title, meta_description, slug, source_name, source_url, original_post_url, original_published_at, image_type, image_url, media_json, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(raw.id, category.id, title, 'Borrador pendiente de revisión editorial.', raw.text, raw.text, 'Sullana, Piura, actualidad local', title, raw.text.slice(0, 155), uniqueSlug(db, title), source.name, source.facebook_url, raw.post_url, raw.published_at, raw.image_url ? 'SOURCE_IMAGE' : 'NO_IMAGE', raw.image_url || null, raw.media_json || '[]', sourceVerification);
      db.prepare('UPDATE raw_posts SET processing_status = ?, verification_status = ? WHERE id = ?').run('DRAFTED', sourceVerification, raw.id);
    }
  }
  const status = errors.length && !posts.length ? 'ERROR' : errors.length ? 'PARTIAL' : 'SUCCESS';
  db.prepare('UPDATE scrape_runs SET finished_at = ?, posts_found = ?, new_posts = ?, duplicates = ?, errors = ?, status = ?, error_message = ? WHERE id = ?').run(now(), posts.length, newPosts, duplicates, errors.length, status, errors.map((error) => `${error.source}: ${error.message}`).join(' | ') || null, Number(run.lastInsertRowid));
  for (const source of sources) {
    const failed = failedSourceIds.has(Number(source.id)) || failedSourceNames.has(String(source.name));
    const recovered = recoveredSourceIds.has(Number(source.id)) && !failed;
    if (failed) db.prepare("UPDATE sources SET enabled=0, pause_reason='SCRAPER_ERROR', last_checked_at=? WHERE id=?").run(now(), source.id);
    else if (recovered) db.prepare("UPDATE sources SET enabled=1, pause_reason='NONE', last_checked_at=?, last_success_at=? WHERE id=?").run(now(), now(), source.id);
    else db.prepare("UPDATE sources SET last_checked_at=?, last_success_at=CASE WHEN ? IN ('SUCCESS','PARTIAL') THEN ? ELSE last_success_at END WHERE id=?").run(now(), status, now(), source.id);
  }
  console.log(JSON.stringify({ run_id: runId, status, posts_found: posts.length, new_posts: newPosts, duplicates, errors }, null, 2));
  db.close();
  process.exitCode = result.error ? 1 : 0;
}
