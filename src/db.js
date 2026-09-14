import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

export function openDatabase(filePath = process.env.DB_PATH || path.join(ROOT, 'data', 'sullana.sqlite')) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new DatabaseSync(resolved);
  db.exec(fs.readFileSync(path.join(ROOT, 'db', 'schema.sql'), 'utf8'));
  return db;
}

export function insertBaseCategories(db) {
  const categories = [
    ['Actualidad', 'actualidad'],
    ['Seguridad', 'seguridad'],
    ['Servicios', 'servicios'],
    ['Política local', 'politica-local'],
    ['Educación', 'educacion'],
    ['Deportes', 'deportes'],
    ['Eventos', 'eventos'],
    ['Economía', 'economia'],
    ['Empleo', 'empleo'],
    ['Comunidad', 'comunidad'],
    ['Emergencias', 'emergencias'],
    ['Presidencia', 'presidencia'],
    ['Asaltos', 'asaltos'],
    ['Entretenimiento', 'entretenimiento'],
  ];
  const statement = db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)');
  for (const category of categories) statement.run(...category);
}

export function getCategory(db, slug = 'actualidad') {
  return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug) || db.prepare('SELECT * FROM categories WHERE slug = ?').get('actualidad');
}

export function listArticles(db, limit = 24) {
  return db.prepare(`
    SELECT a.*, c.name AS category_name, c.slug AS category_slug
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    ORDER BY a.published_at DESC
    LIMIT ?
  `).all(Math.min(Math.max(Number(limit) || 24, 1), 100));
}

export function getArticleBySlug(db, slug) {
  return db.prepare(`
    SELECT a.*, c.name AS category_name, c.slug AS category_slug
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.slug = ?
  `).get(slug);
}

export function recordEvent(db, eventName, articleId = null, metadata = {}) {
  db.prepare('INSERT INTO events (event_name, article_id, metadata_json) VALUES (?, ?, ?)')
    .run(eventName, articleId, JSON.stringify(metadata));
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'noticia-local';
}

export function uniqueSlug(db, preferred, excludeId = null) {
  const base = slugify(preferred);
  let candidate = base;
  let counter = 2;
  while (true) {
    const hit = excludeId
      ? db.prepare('SELECT id FROM news_drafts WHERE slug = ? AND id <> ? UNION SELECT id FROM articles WHERE slug = ?').get(candidate, excludeId, candidate)
      : db.prepare('SELECT id FROM news_drafts WHERE slug = ? UNION SELECT id FROM articles WHERE slug = ?').get(candidate, candidate);
    if (!hit) return candidate;
    candidate = `${base}-${counter++}`;
  }
}

export function contentHash(text, url = '') {
  let hash = 2166136261;
  for (const char of `${text}\n${url}`) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
