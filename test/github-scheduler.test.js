import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../services/github-scheduler/src/index.js';

test('scheduler retries transient GitHub errors and deduplicates a tick', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const values = new Map();
  let noRetry = 0;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1) return new Response(null, { status: 503 });
    return new Response(null, { status: 204 });
  };
  const env = {
    GITHUB_OWNER: 'Adrinoaim',
    GITHUB_REPOSITORY: 'sullana-noticias',
    GITHUB_WORKFLOW: 'scheduled-ingest.yml',
    GITHUB_REF: 'main',
    GITHUB_DISPATCH_TOKEN: 'test-only',
    EXECUTIONS: {
      get: async (key) => values.get(key),
      put: async (key, value) => values.set(key, value),
    },
  };
  const controller = { cron: '17,47 * * * *', scheduledTime: 1757924220000, noRetry: () => { noRetry += 1; } };
  try {
    await worker.scheduled(controller, env, {});
    await worker.scheduled(controller, env, {});
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 2);
  assert.equal(values.size, 1);
  assert.equal(noRetry, 1);
  assert.deepEqual(JSON.parse(calls[1].init.body), { ref: 'main' });
});

test('scheduler health endpoint does not expose the scheduled trigger', async () => {
  assert.equal((await worker.fetch(new Request('https://scheduler/'))).status, 200);
  assert.equal((await worker.fetch(new Request('https://scheduler/__scheduled?cron=x'))).status, 404);
});
