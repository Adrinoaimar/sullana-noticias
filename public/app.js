(() => {
  const track = (eventName, metadata = {}) => {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, metadata);
    fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: eventName, metadata }) }).catch(() => {});
  };
  const buttons = document.querySelectorAll('[data-share]');
  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const url = button.dataset.url;
      const title = button.dataset.title || document.title;
      const eventName = button.dataset.share === 'copy' ? 'copy_link' : `${button.dataset.share}_share`;
      track(eventName, { path: location.pathname });
      if (button.dataset.share === 'copy') {
        await navigator.clipboard?.writeText(url);
        button.textContent = 'Enlace copiado';
        setTimeout(() => { button.textContent = 'Copiar enlace'; }, 1800);
      }
      if (button.dataset.share === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank', 'noopener');
      if (button.dataset.share === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener');
    });
  }

  const loginForm = document.querySelector('#login-form');
  if (!loginForm) return;
  const loginPanel = document.querySelector('#login-panel');
  const adminApp = document.querySelector('#admin-app');
  const logoutButton = document.querySelector('#logout-button');
  const error = document.querySelector('#login-error');
  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const api = async (path, options = {}) => {
    const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'REQUEST_FAILED');
    return data;
  };
  const date = (value) => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha';
  const showApp = () => { loginPanel.hidden = true; adminApp.hidden = false; logoutButton.hidden = false; loadAdmin(); };
  async function loadAdmin() {
    const [dashboard, sources, rawPosts, drafts] = await Promise.all([api('/api/admin/dashboard'), api('/api/admin/sources'), api('/api/admin/raw-posts'), api('/api/admin/drafts')]);
    document.querySelector('#dashboard-cards').innerHTML = [['Visitas hoy', dashboard.visits_today], ['Artículos hoy', dashboard.articles_today], ['Posts detectados', dashboard.posts_detected], ['Borradores', dashboard.drafts]].map(([label, value]) => `<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('');
    document.querySelector('#sources-list').innerHTML = sources.length ? sources.map((source) => `<div class="admin-item"><div class="admin-item__top"><h3>${esc(source.name)}</h3><span class="badge ${source.enabled ? '' : 'badge--warn'}">${source.enabled ? 'Activa' : 'Pausada'}</span></div><p>${esc(source.facebook_url)}<br>Última revisión: ${esc(date(source.last_checked_at))}</p><button class="button button--small" data-toggle-source="${esc(source.id)}" data-enabled="${esc(source.enabled ? 0 : 1)}">${source.enabled ? 'Pausar' : 'Activar'}</button></div>`).join('') : '<p>No hay fuentes configuradas.</p>';
    document.querySelector('#raw-posts-list').innerHTML = rawPosts.length ? rawPosts.slice(0, 12).map((post) => `<div class="admin-item"><div class="admin-item__top"><h3>${esc(post.source_name)}</h3><span class="badge ${post.processing_status === 'VERIFY' ? 'badge--warn' : ''}">${esc(post.processing_status)}</span></div><p>${esc((post.text || '').slice(0, 180))}<br>${esc(date(post.published_at || post.fetched_at))}</p>${post.processing_status !== 'DRAFTED' && post.processing_status !== 'PUBLISHED' && post.processing_status !== 'REJECTED' ? `<button class="button button--small" data-create-draft="${esc(post.id)}">Crear borrador</button> <button class="button button--small" data-reject-post="${esc(post.id)}">Descartar</button>` : ''}</div>`).join('') : '<p>No hay posts detectados. Ejecuta una revisión.</p>';
    document.querySelector('#drafts-list').innerHTML = drafts.length ? drafts.map((draft) => `<div class="admin-item"><div class="admin-item__top"><h3>${esc(draft.title)}</h3><span class="badge ${draft.verification_status === 'VERIFY' ? 'badge--warn' : ''}">${esc(draft.editorial_status)} · ${esc(draft.verification_status)}</span></div><p>${esc(draft.dek)}<br>Fuente: ${esc(draft.source_name)}</p>${draft.editorial_status === 'DRAFT' ? `<button class="button button--small" data-publish-draft="${esc(draft.id)}">${draft.verification_status === 'VERIFY' ? 'Confirmar y publicar' : 'Publicar'}</button>` : `<a class="text-link" href="/noticias/${encodeURIComponent(draft.slug)}">Ver artículo ↗</a>`}</div>`).join('') : '<p>No hay borradores. Los posts relevantes aparecerán aquí.</p>';
    document.querySelectorAll('[data-create-draft]').forEach((button) => button.addEventListener('click', async () => { await api(`/api/admin/raw-posts/${button.dataset.createDraft}/draft`, { method: 'POST', body: '{}' }); await loadAdmin(); }));
    document.querySelectorAll('[data-toggle-source]').forEach((button) => button.addEventListener('click', async () => { await api(`/api/admin/sources/${button.dataset.toggleSource}`, { method: 'PATCH', body: JSON.stringify({ enabled: button.dataset.enabled === '1' }) }); await loadAdmin(); }));
    document.querySelectorAll('[data-reject-post]').forEach((button) => button.addEventListener('click', async () => { await api(`/api/admin/raw-posts/${button.dataset.rejectPost}/reject`, { method: 'POST', body: '{}' }); await loadAdmin(); }));
    document.querySelectorAll('[data-publish-draft]').forEach((button) => button.addEventListener('click', async () => { if (!window.confirm('Confirma revisión editorial y publicación de este borrador.')) return; await api(`/api/admin/drafts/${button.dataset.publishDraft}/publish`, { method: 'POST', body: JSON.stringify({ verified: true }) }); await loadAdmin(); }));
  }
  loginForm.addEventListener('submit', async (event) => { event.preventDefault(); error.textContent = ''; try { await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: new FormData(loginForm).get('password') }) }); track('editor_login'); showApp(); } catch (reason) { error.textContent = reason.message; } });
  logoutButton.addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST', body: '{}' }); location.reload(); });
  document.querySelector('#ingest-button')?.addEventListener('click', async (event) => { event.currentTarget.disabled = true; try { await api('/api/admin/ingest', { method: 'POST', body: '{}' }); await loadAdmin(); } finally { event.currentTarget.disabled = false; } });
  api('/api/admin/session').then(showApp).catch(() => {});
})();
