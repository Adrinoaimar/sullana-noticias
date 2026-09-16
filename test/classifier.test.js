import assert from 'node:assert/strict';
import test from 'node:test';
import { classify, isFacebookChromeText, sectionFor } from '../worker/index.js';

test('political and electoral posts require verification and their own section', () => {
  const result = classify('Las encuestas y el apoyo de la gente confirman que el candidato va en primer lugar en Piura.');
  assert.equal(result.category_slug, 'politica-local');
  assert.equal(result.sensitive, true);
  assert.equal(result.status, 'VERIFY');
});

test('national presidential posts use the presidency section', () => {
  assert.equal(sectionFor('El presidente informó nuevas medidas desde el Congreso.'), 'presidencia');
});

test('political government references require verification', () => {
  const result = classify('Gobierno de Keiko Fujimori anuncia cambios ideológicos en el currículo escolar.', {
    trust_level: 'TRUSTED_MEDIA',
  });
  assert.equal(result.category_slug, 'politica-local');
  assert.equal(result.sensitive, true);
  assert.equal(result.status, 'VERIFY');
});

test('parricide reports use the security section and require verification', () => {
  const result = classify('En vivo: intento de parricidio reportado en Jesús María de Sullana.', {
    trust_level: 'TRUSTED_MEDIA',
  });
  assert.equal(result.category_slug, 'seguridad');
  assert.equal(result.sensitive, true);
  assert.equal(result.status, 'VERIFY');
});

test('common Facebook number masking keeps violent reports under review', () => {
  const result = classify('Videos muestran vi6lencia entre alumn6s en Bellavista.', {
    trust_level: 'TRUSTED_MEDIA',
  });
  assert.equal(result.category_slug, 'seguridad');
  assert.equal(result.sensitive, true);
  assert.equal(result.status, 'VERIFY');
});

test('Facebook interface chrome is never treated as editorial copy', () => {
  assert.equal(isFacebookChromeText('Page · Government organization Plaza Miguel Grau S/N'), true);
  assert.equal(isFacebookChromeText('Log In Forgot Account'), true);
  assert.equal(isFacebookChromeText('Vecinos reportan una obra pública en Sullana.'), false);
});
