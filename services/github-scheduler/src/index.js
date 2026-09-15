const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function dispatchUrl(env) {
  const owner = encodeURIComponent(String(env.GITHUB_OWNER || '').trim());
  const repository = encodeURIComponent(String(env.GITHUB_REPOSITORY || '').trim());
  const workflow = encodeURIComponent(String(env.GITHUB_WORKFLOW || '').trim());
  if (!owner || !repository || !workflow) throw new Error('GITHUB_DISPATCH_CONFIG_MISSING');
  return `https://api.github.com/repos/${owner}/${repository}/actions/workflows/${workflow}/dispatches`;
}

async function dispatchWorkflow(env, controller) {
  const ref = String(env.GITHUB_REF || 'main').trim() || 'main';
  let lastError = 'GITHUB_DISPATCH_FAILED';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(dispatchUrl(env), {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
        'content-type': 'application/json',
        'user-agent': 'sullana-noticias-scheduler',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ ref }),
    });
    if (response.status === 204) return { attempt, ref };
    const retryAfter = Number(response.headers.get('retry-after') || 0);
    lastError = `GITHUB_DISPATCH_${response.status}`;
    if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) break;
    const backoff = Math.min(8000, Math.max(500, retryAfter * 1000 || 500 * (2 ** (attempt - 1))));
    console.warn('[RETRY]', { attempt, status: response.status, backoff_ms: backoff, cron: controller.cron });
    await sleep(backoff);
  }
  throw new Error(lastError);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') return json({ service: 'sullana-noticias-scheduler', status: 'OK' });
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(controller, env) {
    const executionKey = `github-dispatch:${controller.cron}:${controller.scheduledTime}`;
    if (await env.EXECUTIONS.get(executionKey)) {
      console.log('[SKIP_DUPLICATE]', { cron: controller.cron, scheduled_time: controller.scheduledTime });
      controller.noRetry();
      return;
    }
    if (!env.GITHUB_DISPATCH_TOKEN) {
      console.error('[ERROR]', { code: 'GITHUB_DISPATCH_TOKEN_MISSING', cron: controller.cron });
      controller.noRetry();
      return;
    }
    const startedAt = Date.now();
    try {
      const result = await dispatchWorkflow(env, controller);
      await env.EXECUTIONS.put(executionKey, JSON.stringify({ ...result, dispatched_at: new Date().toISOString() }), { expirationTtl: 86400 });
      console.log('[SUCCESS]', { cron: controller.cron, scheduled_time: controller.scheduledTime, attempt: result.attempt, duration_ms: Date.now() - startedAt });
    } catch (error) {
      console.error('[ERROR]', { cron: controller.cron, scheduled_time: controller.scheduledTime, duration_ms: Date.now() - startedAt, code: error instanceof Error ? error.message : 'GITHUB_DISPATCH_FAILED' });
      controller.noRetry();
    }
  },
};
