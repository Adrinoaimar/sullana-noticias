import assert from 'node:assert/strict';
import test from 'node:test';
import { classify, sectionFor } from '../worker/index.js';

test('political and electoral posts require verification and their own section', () => {
  const result = classify('Las encuestas y el apoyo de la gente confirman que el candidato va en primer lugar en Piura.');
  assert.equal(result.category_slug, 'politica-local');
  assert.equal(result.sensitive, true);
  assert.equal(result.status, 'VERIFY');
});

test('national presidential posts use the presidency section', () => {
  assert.equal(sectionFor('El presidente informó nuevas medidas desde el Congreso.'), 'presidencia');
});
