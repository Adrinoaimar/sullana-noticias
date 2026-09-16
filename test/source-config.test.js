import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('Castilla source uses the public official Facebook page', () => {
  const sources = JSON.parse(fs.readFileSync(path.join(root, 'config/public-sources.json'), 'utf8'));
  const source = sources.find((item) => item.name === 'Municipalidad Distrital de Castilla - Piura');
  assert.deepEqual(
    { url: source.facebook_url, identifier: source.facebook_identifier },
    { url: 'https://www.facebook.com/MuniCastillaPiura/', identifier: 'MuniCastillaPiura' },
  );
});
