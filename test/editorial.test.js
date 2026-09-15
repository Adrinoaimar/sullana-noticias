import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEditorialCopy, cleanSourceText } from '../worker/editorial.js';

test('editorial copy keeps all visible facts while changing the presentation', () => {
  const raw = 'Nuevas imágenes muestran avances en Sullana. La municipalidad informó que el trabajo continúa. Like Comment Share 12';
  const copy = buildEditorialCopy(raw, 'El Chilalo Noticias');
  assert.equal(cleanSourceText(raw).endsWith('Share 12'), false);
  assert.match(copy.summary, /El Chilalo Noticias/);
  assert.match(copy.body, /avances en Sullana/);
  assert.match(copy.body, /El mismo reporte agrega/);
  assert.match(copy.body, /comunicó/);
  assert.match(copy.body, /El alcance de esta nota/);
  assert.match(copy.body, /fuente original/);
  assert.notEqual(copy.body, cleanSourceText(raw));
  assert.ok(copy.metaDescription.length <= 155);
});

test('editorial copy preserves numeric dots inside a sentence', () => {
  const copy = buildEditorialCopy('El médico recibió S/1.000 para adelantar la operación.', 'El Chilalo Noticias');
  assert.match(copy.body, /S\/1\.000 para adelantar la operación/);
  assert.doesNotMatch(copy.body, /S\/1\. El mismo reporte/);
});
