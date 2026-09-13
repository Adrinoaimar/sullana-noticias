import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { contentHash, getCategory, insertBaseCategories, openDatabase, slugify, uniqueSlug } from '../src/db.js';

test('database schema and editorial helpers work', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sullana-noticias-'));
  const db = openDatabase(path.join(dir, 'test.sqlite'));
  insertBaseCategories(db);
  assert.equal(slugify('Corte de agua en Sullana'), 'corte-de-agua-en-sullana');
  assert.equal(getCategory(db, 'servicios').name, 'Servicios');
  assert.equal(contentHash('A', 'https://example.test/1'), contentHash('A', 'https://example.test/1'));
  const category = getCategory(db, 'actualidad');
  const source = db.prepare('INSERT INTO sources (name, facebook_url, facebook_identifier) VALUES (?, ?, ?)').run('Test', 'https://www.facebook.com/test', 'test');
  const raw = db.prepare('INSERT INTO raw_posts (source_id, text, post_url, content_hash) VALUES (?, ?, ?, ?)').run(source.lastInsertRowid, 'Texto', 'https://www.facebook.com/test/posts/1', 'test-hash');
  db.prepare('INSERT INTO news_drafts (raw_post_id, category_id, title, slug, source_name, source_url, original_post_url) VALUES (?, ?, ?, ?, ?, ?, ?)').run(raw.lastInsertRowid, category.id, 'Corte de agua', 'corte-de-agua', 'Test', 'https://www.facebook.com/test', 'https://www.facebook.com/test/posts/1');
  assert.equal(uniqueSlug(db, 'Corte de agua'), 'corte-de-agua-2');
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
