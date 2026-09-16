import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { DEPRECATED_SOURCE_SQL } from '../worker/index.js';

test('deprecated Castilla alias is disabled when the official row exists', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE sources (
    id INTEGER PRIMARY KEY,
    facebook_identifier TEXT NOT NULL,
    enabled INTEGER NOT NULL,
    pause_reason TEXT NOT NULL CHECK (pause_reason IN ('NONE', 'MANUAL', 'SCRAPER_ERROR')),
    last_checked_at TEXT
  )`);
  const insert = db.prepare('INSERT INTO sources (facebook_identifier, enabled, pause_reason) VALUES (?, ?, ?)');
  insert.run('muni.castilla.3', 1, 'NONE');
  insert.run('MuniCastillaPiura', 1, 'NONE');
  db.prepare(DEPRECATED_SOURCE_SQL).run('2026-09-16T13:00:00Z', 'muni.castilla.3', 'MuniCastillaPiura');
  const alias = db.prepare('SELECT enabled, pause_reason FROM sources WHERE facebook_identifier=?').get('muni.castilla.3');
  const official = db.prepare('SELECT enabled, pause_reason FROM sources WHERE facebook_identifier=?').get('MuniCastillaPiura');
  assert.equal(alias.enabled, 0);
  assert.equal(alias.pause_reason, 'MANUAL');
  assert.equal(official.enabled, 1);
  assert.equal(official.pause_reason, 'NONE');
  db.close();
});
