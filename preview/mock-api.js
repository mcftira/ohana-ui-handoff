/* LOCAL UI DEMO ONLY. No network fallback, provider SDK, key or backend. */
(() => {
  'use strict';
  const origin = location.origin;
  const allowedScenarios = ['success', 'confirmed', 'pending', 'conflict', 'error', 'checkout-error', 'availability-error', 'full', 'unavailable'];
  const params = new URLSearchParams(location.search);
  let scenario = params.get('demo') || sessionStorage.getItem('ohana_demo_scenario') || 'success';
  if (!allowedScenarios.includes(scenario)) scenario = 'success';
  sessionStorage.setItem('ohana_demo_scenario', scenario);
  const blocks = [
    { id: 'morning', label: 'Reggeli sáv', start: '06:30', end: '09:30', hours: 3, price: 9000 },
    { id: 'office', label: 'Office Hours', start: '10:00', end: '16:00', hours: 6, price: 24000 },
    { id: 'evening', label: 'Esti sáv', start: '17:00', end: '22:00', hours: 5, price: 33000 },
    { id: 'day', label: 'Egész nap', start: '06:30', end: '22:00', hours: 15.5, price: 49000 },
  ];
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const mode = () => scenario === 'unavailable' ? 'unavailable' : scenario === 'confirmed' ? 'live' : 'test';

  window.fetch = async function (input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const method = (options.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
    if (url.origin !== origin) throw new TypeError('External requests are disabled in the UI demo.');
    // All API replies are fabricated here. Unknown routes fail closed.
    if (url.pathname === '/api/booking-config' && method === 'GET') return response({ mode: mode() });
    if (url.pathname === '/api/availability' && method === 'GET') {
      if (scenario === 'availability-error') return response({ error: 'Synthetic availability error' }, 503);
      const date = url.searchParams.get('date') || '';
      return response({ date, blocks: blocks.map((block, i) => ({ ...block,
        available: scenario !== 'full' && !(Number(date.slice(-2)) % 3 === 0 && (i === 1 || i === 3)),
      })) });
    }
    if (url.pathname === '/api/checkout' && method === 'POST') {
      if (scenario === 'checkout-error') return response({ ok: false, error: 'Demó: a fizetés indítása nem sikerült.' }, 503);
      if (scenario === 'unavailable') return response({ ok: false, code: 'booking_unavailable' }, 503);
      let data; try { data = JSON.parse(options.body || '{}'); } catch { return response({ ok: false }, 400); }
      const block = blocks.find(item => item.id === data.blockId);
      if (!block || !data.date || data.termsAccepted !== true) return response({ ok: false, error: 'Hiányos demó adatok.' }, 400);
      // Deliberately discard name, email, phone and notes. Store no personal data.
      sessionStorage.setItem('ohana_demo_checkout', JSON.stringify({ price: block.price, date: data.date, label: block.label }));
      return response({ ok: true, url: '/preview/mock-checkout.html' });
    }
    if (url.pathname === '/api/finalize' && method === 'GET') {
      if (url.searchParams.get('session_id') !== 'DEMO-NO-RESERVATION') return response({ ok: false, error: 'Ismeretlen demó azonosító.' }, 400);
      if (scenario === 'pending') return response({ ok: false, paid: true, pending: true }, 202);
      if (scenario === 'conflict') return response({ ok: false, paid: true, code: 'slot_conflict', reviewRequired: true }, 409);
      if (scenario === 'error') return response({ ok: false, error: 'Demó: az eredmény nem ellenőrizhető.' }, 400);
      let saved; try { saved = JSON.parse(sessionStorage.getItem('ohana_demo_checkout') || '{}'); } catch { saved = {}; }
      return response({ ok: true, referenceNumber: 'DEMO-NO-RESERVATION', totalPrice: saved.price || 9000,
        paid: true, testMode: scenario !== 'confirmed', simulated: scenario !== 'confirmed' });
    }
    throw new TypeError('This route does not exist in the UI demo.');
  };
  // Defense in depth: CSP blocks these too; do not allow API bypasses.
  window.XMLHttpRequest = class { constructor() { throw new Error('XHR disabled in the UI demo.'); } };
  window.WebSocket = class { constructor() { throw new Error('WebSocket disabled in the UI demo.'); } };
  window.EventSource = class { constructor() { throw new Error('EventSource disabled in the UI demo.'); } };
  navigator.sendBeacon = () => false;
  const external = value => {
    try { const url = new URL(value, location.href); return url.origin !== origin || !['http:', 'https:'].includes(url.protocol); }
    catch { return true; }
  };
  const note = () => {
    const element = document.getElementById('ohana-demo-message');
    if (element) { element.hidden = false; element.textContent = 'Demó: külső kapcsolat letiltva. Nem nyílik WhatsApp, email, fizetés vagy éles rendszer.'; }
  };
  window.open = () => { note(); return null; };
  function guardLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      if (external(link.getAttribute('href'))) {
        link.dataset.demoExternal = 'true';
        link.setAttribute('href', '#demo-only');
        link.removeAttribute('target');
        link.setAttribute('aria-disabled', 'true');
        link.title = 'Külső kapcsolat letiltva az UI demóban';
      }
    });
  }
  ['click', 'auxclick'].forEach(type => document.addEventListener(type, event => {
    const link = event.target.closest?.('a');
    if (link && (link.dataset.demoExternal || external(link.href))) { event.preventDefault(); event.stopImmediatePropagation(); note(); }
  }, true));
  document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); note(); }, true);
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('aside');
    bar.id = 'ohana-demo';
    bar.setAttribute('aria-label', 'UI bemutató vezérlők');
    bar.innerHTML = '<strong>UI DEMÓ</strong><span>Csak mintaadatok · nincs foglalás, terhelés vagy email</span>' +
      '<label>Állapot <select id="demo-scenario"><option value="success">Sikeres próbafizetés</option><option value="confirmed">Éles siker képernyő (szimuláció)</option><option value="pending">Feldolgozás alatt</option><option value="conflict">Sávütközés</option><option value="error">Ismeretlen eredmény</option><option value="checkout-error">Fizetésindítási hiba</option><option value="availability-error">Sávbetöltési hiba</option><option value="full">Betelt nap</option><option value="unavailable">Fizetés nem elérhető</option></select></label>' +
      '<button type="button" id="demo-fill">Mintaadatok kitöltése</button><a href="/">Főoldal</a><a href="/foglalas/">Vendégfoglalás</a><a href="/previews/booking-admin.html">Admin demó</a><a href="/previews/crm.html">CRM demó</a>' +
      '<p id="ohana-demo-message" role="status" hidden></p>';
    document.body.prepend(bar);
    const select = document.getElementById('demo-scenario');
    select.value = scenario;
    select.addEventListener('change', () => {
      scenario = select.value; sessionStorage.setItem('ohana_demo_scenario', scenario);
      location.href = location.pathname === '/preview/mock-checkout.html' ? '/foglalas/?demo=' + scenario : location.pathname + '?demo=' + scenario;
    });
    document.getElementById('demo-fill').addEventListener('click', () => {
      const values = { name: 'Minta Vendég', email: 'guest@example.invalid', phone: '+36 00 000 0000', headcount: '8', notes: 'Kizárólag kitalált UI tesztadat.', usecase: 'jóga' };
      for (const [key, value] of Object.entries(values)) {
        const input = document.getElementById(key);
        if (input) { input.value = value; input.dispatchEvent(new Event(key === 'usecase' ? 'change' : 'input', { bubbles: true })); }
      }
    });
    guardLinks();
    new MutationObserver(guardLinks).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
  });
})();
