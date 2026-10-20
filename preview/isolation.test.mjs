import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, symlink, unlink } from 'node:fs/promises';
import http from 'node:http';
import vm from 'node:vm';
import { createServer, injectPreview } from './server.mjs';

let server, origin;
before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
});
after(() => new Promise(resolve => server.close(resolve)));

function rawRequest(path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request(origin, { path, method, headers }, response => {
      let text = '';
      response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, text }));
    });
    request.on('error', reject); request.end();
  });
}
test('original UI is served with restrictive headers and local preview injection', async () => {
  const response = await fetch(origin + '/foglalas/');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/);
  assert.match(response.headers.get('content-security-policy'), /form-action 'none'/);
  assert.match(response.headers.get('content-security-policy'), /base-uri 'none'/);
  assert.match(html, /\/preview\/mock-api\.js/);
  assert.doesNotMatch(html, /<link[^>]+https:\/\/fonts\./);
  const source = await readFile(new URL('../website/foglalas/index.html', import.meta.url), 'utf8');
  assert.match(source, /https:\/\/fonts\.googleapis\.com/);
  assert.equal(html, injectPreview(source));
});
test('all methods on backend routes fail; static POST is not accepted', async () => {
  for (const path of ['/api/checkout', '/api/finalize', '/api/availability']) {
    for (const method of ['GET', 'POST']) assert.equal((await rawRequest(path, {}, method)).status, 410);
  }
  assert.equal((await rawRequest('/foglalas/', {}, 'POST')).status, 405);
});
test('repo, docs, secrets, traversal and non-loopback hostnames cannot be served', async () => {
  for (const path of [
    '/.git/config', '/README.md', '/package.json', '/.env', '/preview/server.mjs',
    '/preview/isolation.test.mjs', '/assets/photos/sources.json', '/assets/ohana-house-logo.png',
    '/%2e%2e/README.md', '/assets/%2e%2e/%2e%2e/README.md', '/themes/../../README.md',
    '/themes/%2e%2e/README.md', '/preview/%5c..%5cREADME.md', '/%00.html',
    '/netlify/functions/checkout.js',
  ]) assert.equal((await rawRequest(path)).status, 404, path);
  assert.equal((await rawRequest('/', { Host: 'attacker.example' })).status, 403);
});
test('symlink escape cannot expose a file outside the static allowlist', async () => {
  const link = new URL('../website/assets/leak.png', import.meta.url);
  await symlink(new URL('../package.json', import.meta.url), link);
  try { assert.equal((await fetch(origin + '/assets/leak.png')).status, 404); }
  finally { await unlink(link); }
});

async function mockEnvironment(scenario = 'success') {
  const store = new Map();
  const listeners = {};
  const window = {};
  const context = {
    window, location: { origin, href: origin + '/foglalas/?demo=' + scenario, search: '?demo=' + scenario, pathname: '/foglalas/' },
    sessionStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    navigator: {}, URL, URLSearchParams, Response, DOMException, Event,
    document: { addEventListener: (type, fn) => { listeners[type] = fn; }, getElementById: () => null },
  };
  vm.runInNewContext(await readFile(new URL('./mock-api.js', import.meta.url), 'utf8'), context);
  return { fetch: window.fetch, window, store, listeners, context };
}
test('mock rejects external and unknown requests without a native network fallback', async () => {
  const mock = await mockEnvironment();
  for (const url of ['https://ohana6.com/api/checkout', 'https://api.stripe.com', '/api/not-implemented']) {
    await assert.rejects(mock.fetch(url), /disabled|does not exist/);
  }
  assert.throws(() => new mock.window.XMLHttpRequest(), /disabled/);
  assert.throws(() => new mock.window.WebSocket(), /disabled/);
  assert.equal(mock.context.navigator.sendBeacon('https://example.com', 'data'), false);
});
test('synthetic booking chain preserves UI contracts and never stores guest contact fields', async () => {
  const mock = await mockEnvironment();
  assert.equal((await (await mock.fetch('/api/booking-config')).json()).mode, 'test');
  const availability = await (await mock.fetch('/api/availability?date=2030-01-02')).json();
  assert.equal(availability.blocks.length, 4);
  const checkout = await (await mock.fetch('/api/checkout', {
    method: 'POST', body: JSON.stringify({
      date: '2030-01-02', blockId: 'morning', termsAccepted: true,
      name: 'Synthetic Person', email: 'example@example.invalid', phone: '+00 000000000', notes: 'Discard this',
    }),
  })).json();
  assert.equal(checkout.url, '/preview/mock-checkout.html');
  const saved = JSON.parse(mock.store.get('ohana_demo_checkout'));
  assert.deepEqual(Object.keys(saved).sort(), ['date', 'label', 'price']);
  const result = await (await mock.fetch('/api/finalize?session_id=DEMO-NO-RESERVATION')).json();
  assert.equal(result.testMode, true);
  assert.equal(result.simulated, true);
  assert.equal(result.referenceNumber, 'DEMO-NO-RESERVATION');
});
test('mock supports confirmation, pending, conflict and failure UI states', async () => {
  for (const [scenario, expected] of [
    ['confirmed', { ok: true, testMode: false }],
    ['pending', { ok: false, pending: true }],
    ['conflict', { ok: false, code: 'slot_conflict' }],
    ['error', { ok: false }],
  ]) {
    const mock = await mockEnvironment(scenario);
    const result = await (await mock.fetch('/api/finalize?session_id=DEMO-NO-RESERVATION')).json();
    for (const [key, value] of Object.entries(expected)) assert.equal(result[key], value, scenario);
  }
  const error = await mockEnvironment('availability-error');
  assert.equal((await error.fetch('/api/availability?date=2030-01-02')).status, 503);
  const full = await mockEnvironment('full');
  assert.ok((await (await full.fetch('/api/availability?date=2030-01-02')).json()).blocks.every(block => !block.available));
});
test('external dynamic clicks, auxiliary clicks, popups and forms are stopped', async () => {
  const mock = await mockEnvironment();
  for (const type of ['click', 'auxclick']) {
    let prevented = false, stopped = false;
    mock.listeners[type]({
      target: { closest: () => ({ dataset: {}, href: 'https://wa.me/00000000000' }) },
      preventDefault: () => { prevented = true; },
      stopImmediatePropagation: () => { stopped = true; },
    });
    assert.equal(prevented, true); assert.equal(stopped, true);
  }
  let submitted = true;
  mock.listeners.submit({ preventDefault: () => { submitted = false; }, stopImmediatePropagation: () => {} });
  assert.equal(submitted, false);
  assert.equal(mock.window.open('https://ohana6.com'), null);
});
