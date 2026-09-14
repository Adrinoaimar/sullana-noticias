import { openDatabase, insertBaseCategories, getCategory } from '../src/db.js';

const db = openDatabase();
insertBaseCategories(db);

const sources = [
  ['Turismo Sullana MPS', 'https://www.facebook.com/TurismoSullanaMPS/', 'TurismoSullanaMPS', 'OFFICIAL', 0],
  ['Municipalidad Bellavista Oficial', 'https://www.facebook.com/MunicipalidadBellavistaOficial', 'MunicipalidadBellavistaOficial', 'OFFICIAL', 0],
  ['Municipalidad Distrital de Marcavelica', 'https://www.facebook.com/munimarcavelica', 'munimarcavelica', 'OFFICIAL', 0],
  ['Municipalidad Distrital de Querecotillo', 'https://www.facebook.com/MuniQuerecotillo', 'MuniQuerecotillo', 'OFFICIAL', 0],
  ['Municipalidad Distrital de Ignacio Escudero', 'https://www.facebook.com/m.d.ignacio.escudero', 'm.d.ignacio.escudero', 'OFFICIAL', 0],
  ['El Chilalo Noticias', 'https://www.facebook.com/ElChilaloNoticias/', 'ElChilaloNoticias', 'TRUSTED_MEDIA', 1],
  ['Del Chira Noticias', 'https://www.facebook.com/delchiranoticias', 'delchiranoticias', 'TRUSTED_MEDIA', 1],
];
const addSource = db.prepare('INSERT OR IGNORE INTO sources (name, facebook_url, facebook_identifier, trust_level, enabled, auto_draft, auto_publish) VALUES (?, ?, ?, ?, ?, 1, 0)');
for (const source of sources) addSource.run(...source);

if (process.env.SEED_DEMO_ARTICLE !== '0' && !db.prepare('SELECT id FROM articles WHERE slug = ?').get('demo-flujo-editorial-sullana')) {
  const source = db.prepare('SELECT * FROM sources WHERE facebook_identifier = ?').get('TurismoSullanaMPS');
  const category = getCategory(db, 'actualidad');
  const raw = db.prepare('INSERT INTO raw_posts (source_id, external_post_id, text, post_url, published_at, content_hash, processing_status, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(source.id, 'fixture-demo-001', 'Contenido de demostración local. No representa una publicación real y debe sustituirse antes del lanzamiento.', 'https://www.gob.pe/munisullana', new Date().toISOString(), 'fixture-demo-001', 'PUBLISHED', 'VERIFIED');
  const draft = db.prepare(`INSERT INTO news_drafts (raw_post_id, category_id, title, dek, summary, body, keywords, meta_title, meta_description, slug, source_name, source_url, original_post_url, original_published_at, verification_status, editorial_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(raw.lastInsertRowid, category.id, 'Ejemplo editorial: información local con fuente identificable', 'Fixture de desarrollo para revisar el flujo visual del portal.', 'Contenido de demostración local. Sustituir antes de producción.', 'Este artículo es un fixture de desarrollo. El portal conserva fuente, enlace original y estado editorial para que cada publicación real pueda ser revisada antes de difundirse.', 'Sullana, Piura, noticias locales', 'Ejemplo editorial · Sullana Noticias', 'Fixture de desarrollo; no es una noticia real.', 'demo-flujo-editorial-sullana', 'Fixture de desarrollo', 'https://www.gob.pe/munisullana', 'https://www.gob.pe/munisullana', new Date().toISOString(), 'VERIFIED', 'PUBLISHED');
  db.prepare(`INSERT INTO articles (draft_id, category_id, title, dek, summary, body, keywords, meta_title, meta_description, slug, canonical_url, source_name, source_url, original_post_url, original_published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(draft.lastInsertRowid, category.id, 'Ejemplo editorial: información local con fuente identificable', 'Fixture de desarrollo para revisar el flujo visual del portal.', 'Contenido de demostración local. Sustituir antes de producción.', 'Este artículo es un fixture de desarrollo. El portal conserva fuente, enlace original y estado editorial para que cada publicación real pueda ser revisada antes de difundirse.', 'Sullana, Piura, noticias locales', 'Ejemplo editorial · Sullana Noticias', 'Fixture de desarrollo; no es una noticia real.', 'demo-flujo-editorial-sullana', 'http://localhost:8787/noticias/demo-flujo-editorial-sullana', 'Fixture de desarrollo', 'https://www.gob.pe/munisullana', 'https://www.gob.pe/munisullana', new Date().toISOString());
}

console.log(JSON.stringify({ ok: true, sources: sources.length, demo_article: process.env.SEED_DEMO_ARTICLE !== '0' }, null, 2));
db.close();
