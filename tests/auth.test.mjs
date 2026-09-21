import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const env = {
  VITE_COGNITO_DOMAIN: 'https://example.auth.ap-northeast-1.amazoncognito.com',
  VITE_COGNITO_CLIENT_ID: 'test-client',
  VITE_COGNITO_REDIRECT_URI: 'http://localhost:5173/',
  VITE_COGNITO_LOGOUT_URI: 'http://localhost:5173/',
  VITE_API_BASE_URL: 'https://api.example.test',
};
const tokenKey = 'morning-duty.auth.token';
const pkceKey = 'morning-duty.auth.pkce';
let moduleId = 0;
const sessions = new WeakMap();
const idToken = (expiresAt = Date.now() + 3600000) => `header.${Buffer.from(JSON.stringify({ exp: Math.floor(expiresAt / 1000) })).toString('base64url')}.signature`;
async function setup(storage = new Map(), href = 'http://localhost:5173/', session = sessions.get(storage) ?? new Map()) {
  sessions.set(storage, session);
  const redirects = [];
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.sessionStorage = {
    getItem: (key) => session.get(key) ?? null,
    setItem: (key, value) => session.set(key, value),
    removeItem: (key) => session.delete(key),
  };
  globalThis.window = new EventTarget();
  window.location = { href, replace: (url) => redirects.push(new URL(url)) };
  window.history = { state: null, replaceState: (_, __, url) => { window.location.href = new URL(url, href).href; } };
  const source = (await readFile(new URL('../src/auth/cognito.js', import.meta.url), 'utf8'))
    .replace('import.meta.env', JSON.stringify(env));
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source + `\n// ${moduleId++}`).toString('base64')}`;
  const auth = await import(moduleUrl);
  return { auth, storage, session, redirects, moduleUrl };
}
function storedToken(storage) {
  storage.set(tokenKey, JSON.stringify({ accessToken: 'test-access', idToken: idToken(), idExpiresAt: Date.now() + 3600000, expiresAt: Date.now() + 3600000 }));
}
async function loginCallback(storage, state) {
  return setup(storage, `http://localhost:5173/?code=test-code&state=${state}&keep=yes`);
}

test('PKCE S256, state, one-use exchange, callback cleanup and session reload', async () => {
  let ctx = await setup();
  assert.equal(await ctx.auth.initializeAuth(), false);
  const request = ctx.redirects[0].searchParams;
  const tx = JSON.parse(ctx.session.get(pkceKey));
  assert.equal(request.get('scope'), 'openid');
  assert.equal(request.get('response_type'), 'code');
  assert.equal(request.get('code_challenge_method'), 'S256');
  assert.equal(request.get('code_challenge'), createHash('sha256').update(tx.verifier).digest('base64url'));
  assert.match(tx.verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(request.get('state'), tx.state);
  ctx = await loginCallback(ctx.storage, tx.state);
  let exchanges = 0;
  globalThis.fetch = async (url, options) => {
    exchanges++;
    assert.equal(url.pathname, '/oauth2/token');
    assert.equal(options.body.get('code_verifier'), tx.verifier);
    assert.equal(options.body.get('client_secret'), null);
    return { ok: true, json: async () => ({ access_token: 'test-access', id_token: idToken(), token_type: 'Bearer', expires_in: 3600, refresh_token: 'unused-refresh' }) };
  };
  assert.deepEqual(await Promise.all([ctx.auth.initializeAuth(), ctx.auth.initializeAuth()]), [true, true]);
  assert.equal(exchanges, 1);
  assert.equal(window.location.href, 'http://localhost:5173/?keep=yes');
  assert.equal(ctx.session.has(pkceKey), false);
  assert.equal(ctx.auth.getAccessToken(), 'test-access');
  assert.equal(JSON.parse(ctx.storage.get(tokenKey)).refreshToken, 'unused-refresh');
  assert.ok(JSON.parse(ctx.storage.get(tokenKey)).idToken);
  assert.ok(JSON.parse(ctx.storage.get(tokenKey)).idExpiresAt > Date.now());
  ctx = await setup(ctx.storage);
  assert.equal(await ctx.auth.initializeAuth(), true);
  assert.equal(ctx.redirects.length, 0);
});

test('invalid/missing/expired state and provider/token errors never authenticate or loop', async () => {
  for (const kind of ['wrong', 'missing', 'expired', 'provider', 'exchange']) {
    let ctx = await setup();
    await ctx.auth.initializeAuth();
    const tx = JSON.parse(ctx.session.get(pkceKey));
    if (kind === 'missing') ctx.session.delete(pkceKey);
    if (kind === 'expired') ctx.session.set(pkceKey, JSON.stringify({ ...tx, createdAt: Date.now() - 700000 }));
    ctx = await loginCallback(ctx.storage, kind === 'wrong' ? 'wrong' : tx.state);
    if (kind === 'provider') window.location.href = 'http://localhost:5173/?error=access_denied';
    let exchanges = 0;
    globalThis.fetch = async () => { exchanges++; return { ok: false }; };
    await assert.rejects(ctx.auth.initializeAuth(), { message: 'AUTH_FAILED' });
    assert.equal(exchanges, kind === 'exchange' ? 1 : 0);
    assert.equal(ctx.auth.getAccessToken(), null);
    assert.equal(new URL(window.location.href).searchParams.has('code'), false);
    ctx = await setup(ctx.storage);
    await assert.rejects(ctx.auth.initializeAuth());
    assert.equal(ctx.redirects.length, 0);
  }
});

test('401 recovery redirects once across reload, blocks repeated failures, manual retry uses fresh PKCE', async () => {
  let ctx = await setup();
  storedToken(ctx.storage);
  await Promise.all([ctx.auth.recoverAuthentication(), ctx.auth.recoverAuthentication()]);
  assert.equal(ctx.redirects.length, 1);
  assert.equal(ctx.auth.getAccessToken(), null);
  const first = JSON.parse(ctx.session.get(pkceKey));
  ctx = await setup(ctx.storage);
  storedToken(ctx.storage);
  await ctx.auth.recoverAuthentication();
  assert.equal(ctx.redirects.length, 0);
  assert.equal(ctx.auth.getAccessToken(), null);
  await ctx.auth.retryLogin();
  assert.equal(ctx.redirects.length, 1);
  const second = JSON.parse(ctx.session.get(pkceKey));
  assert.notEqual(first.verifier, second.verifier);
  assert.notEqual(first.state, second.state);
});

test('logout clears credentials and uses configured Cognito return URL; expired token rejected', async () => {
  const ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'expired', expiresAt: Date.now() - 1 }));
  assert.equal(ctx.auth.getAccessToken(), null);
  storedToken(ctx.storage);
  ctx.auth.logout();
  assert.equal(ctx.storage.has(tokenKey), false);
  assert.equal(ctx.redirects[0].pathname, '/logout');
  assert.equal(ctx.redirects[0].searchParams.get('logout_uri'), env.VITE_COGNITO_LOGOUT_URI);
});

test('Axios guards all three APIs, attaches access token, sanitizes errors, handles 401', async () => {
  const ctx = await setup();
  const axiosUrl = new URL('../node_modules/axios/index.js', import.meta.url).href;
  const source = (await readFile(new URL('../src/api/apiClient.js', import.meta.url), 'utf8'))
    .replace("'axios'", JSON.stringify(axiosUrl))
    .replace("'../auth/cognito.js'", JSON.stringify(ctx.moduleUrl))
    .replace('import.meta.env.VITE_API_BASE_URL', JSON.stringify(env.VITE_API_BASE_URL));
  const { default: api } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  let sent = 0;
  api.defaults.adapter = async (config) => {
    sent++;
    assert.equal(config.headers.get('Authorization'), 'Bearer test-access');
    return { data: {}, status: 200, config };
  };
  storedToken(ctx.storage);
  await api.get('/calendar');
  await api.patch('/me/notification', { enabled: true });
  await api.post('/schedule/swap', { myDate: '2026-09-24', targetDate: '2026-09-25' });
  assert.equal(sent, 3);
  api.defaults.adapter = async (config) => { throw { config, response: { status: 401, data: 'private' } }; };
  await assert.rejects(api.get('/calendar'), (error) => {
    assert.equal(error.response.status, 401);
    assert.equal(error.config, undefined);
    assert.equal(error.response.data, undefined);
    return true;
  });
  assert.equal(ctx.auth.getAccessToken(), null);
  assert.equal(ctx.redirects.length, 1);
  for (const path of ['/calendar', '/me/notification', '/schedule/swap']) await assert.rejects(api.get(path));
  assert.equal(sent, 3);
});


test('expired session refreshes once for concurrent requests, rotates and preserves refresh tokens', async () => {
  let ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'old', expiresAt: Date.now() + 10000, refreshToken: 'refresh-1' }));
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url.pathname, '/oauth2/token');
    assert.equal(options.body.get('grant_type'), 'refresh_token');
    assert.equal(options.body.get('refresh_token'), 'refresh-1');
    return { ok: true, json: async () => ({ access_token: 'new', id_token: idToken(), token_type: 'Bearer', expires_in: 3600, refresh_token: 'refresh-2' }) };
  };
  assert.deepEqual(await Promise.all([ctx.auth.ensureAccessToken(), ctx.auth.ensureAccessToken()]), ['new', 'new']);
  assert.equal(calls, 1);
  assert.equal(JSON.parse(ctx.storage.get(tokenKey)).refreshToken, 'refresh-2');
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ access_token: 'next', id_token: idToken(), token_type: 'Bearer', expires_in: 3600 }) });
  assert.equal(await ctx.auth.ensureAccessToken('new'), 'next');
  assert.equal(JSON.parse(ctx.storage.get(tokenKey)).refreshToken, 'refresh-2');
  ctx.storage.set(tokenKey, JSON.stringify({ ...JSON.parse(ctx.storage.get(tokenKey)), expiresAt: 0 }));
  ctx = await setup(ctx.storage);
  assert.equal(await ctx.auth.initializeAuth(), true);
  assert.equal(ctx.redirects.length, 0);
});

test('temporary refresh failures retain credentials; invalid_grant clears them', async () => {
  const ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'old', expiresAt: 0, refreshToken: 'refresh' }));
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(ctx.auth.ensureAccessToken());
  assert.equal(JSON.parse(ctx.storage.get(tokenKey)).refreshToken, 'refresh');
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'server_error' }) });
  await assert.rejects(ctx.auth.ensureAccessToken());
  assert.equal(ctx.storage.has(tokenKey), true);
  globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) });
  assert.equal(await ctx.auth.ensureAccessToken(), null);
  assert.equal(ctx.storage.has(tokenKey), false);
});

test('logout during refresh cannot restore credentials', async () => {
  const ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'old', expiresAt: 0, refreshToken: 'refresh' }));
  let resolve;
  globalThis.fetch = () => new Promise((done) => { resolve = done; });
  const pending = ctx.auth.ensureAccessToken();
  ctx.auth.logout();
  resolve({ ok: true, json: async () => ({ access_token: 'new', id_token: idToken(), token_type: 'Bearer', expires_in: 3600 }) });
  assert.equal(await pending, null);
  assert.equal(ctx.storage.has(tokenKey), false);
});

test('concurrent API 401s refresh once and retry once; repeated 401 stops', async () => {
  const ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'old', idToken: idToken(), idExpiresAt: Date.now() + 3600000, expiresAt: Date.now() + 3600000, refreshToken: 'refresh' }));
  const axiosUrl = new URL('../node_modules/axios/index.js', import.meta.url).href;
  const source = (await readFile(new URL('../src/api/apiClient.js', import.meta.url), 'utf8'))
    .replace("'axios'", JSON.stringify(axiosUrl))
    .replace("'../auth/cognito.js'", JSON.stringify(ctx.moduleUrl))
    .replace('import.meta.env.VITE_API_BASE_URL', JSON.stringify(env.VITE_API_BASE_URL));
  const { default: api } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  let refreshes = 0;
  globalThis.fetch = async () => {
    refreshes++;
    return { ok: true, json: async () => ({ access_token: 'new', id_token: idToken(), token_type: 'Bearer', expires_in: 3600 }) };
  };
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests++;
    if (config.headers.get('Authorization') === 'Bearer old') throw { config, response: { status: 401 } };
    return { data: {}, status: 200, config };
  };
  await Promise.all([api.get('/calendar'), api.get('/calendar')]);
  assert.equal(refreshes, 1);
  assert.equal(requests, 4);
  assert.equal(ctx.redirects.length, 0);
  requests = 0;
  api.defaults.adapter = async (config) => { requests++; throw { config, response: { status: 401 } }; };
  await assert.rejects(api.get('/calendar'));
  assert.equal(requests, 2);
  assert.equal(ctx.redirects.length, 0);
  assert.equal(JSON.parse(ctx.storage.get(tokenKey)).refreshToken, 'refresh');
});


test('browser restart with empty sessionStorage restores persisted tokens and renews expired ID token', async () => {
  let ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'still-valid', expiresAt: Date.now() + 3600000,
    idToken: idToken(0), idExpiresAt: 0, refreshToken: 'persistent-refresh' }));
  ctx = await setup(ctx.storage, 'http://localhost:5173/', new Map());
  let calls = 0;
  globalThis.fetch = async (_, options) => {
    calls++;
    assert.equal(options.body.get('refresh_token'), 'persistent-refresh');
    return { ok: true, json: async () => ({ access_token: 'renewed-access', id_token: idToken(), token_type: 'Bearer', expires_in: 3600 }) };
  };
  assert.equal(await ctx.auth.initializeAuth(), true);
  assert.equal(calls, 1);
  assert.equal(ctx.auth.getAccessToken(), 'renewed-access');
  assert.equal(ctx.redirects.length, 0);
  assert.equal(ctx.session.has(tokenKey), false);
  ctx = await setup(ctx.storage, 'http://localhost:5173/', new Map());
  assert.equal(await ctx.auth.initializeAuth(), true);
  assert.equal(calls, 1);
  ctx.auth.logout();
  assert.equal(ctx.storage.has(tokenKey), false);
  ctx = await setup(ctx.storage, 'http://localhost:5173/', new Map());
  assert.equal(await ctx.auth.initializeAuth(), false);
  assert.equal(ctx.redirects[0].pathname, '/oauth2/authorize');
});

test('legacy session tokens migrate; temporary startup failure can retry without login', async () => {
  const ctx = await setup();
  ctx.session.set(tokenKey, JSON.stringify({ accessToken: 'old', expiresAt: 0, refreshToken: 'legacy-refresh' }));
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(ctx.auth.initializeAuth());
  assert.equal(ctx.session.has(tokenKey), false);
  assert.equal(JSON.parse(ctx.storage.get(tokenKey)).refreshToken, 'legacy-refresh');
  assert.equal(ctx.redirects.length, 0);
  let status;
  window.addEventListener(ctx.auth.AUTH_EVENT, (event) => { status = event.detail; });
  await ctx.auth.retryLogin();
  assert.equal(status, 'error');
  assert.equal(ctx.redirects.length, 0);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ access_token: 'new', id_token: idToken(), token_type: 'Bearer', expires_in: 3600 }) });
  await ctx.auth.retryLogin();
  assert.equal(status, 'ready');
  assert.equal(ctx.redirects.length, 0);
});

test('expired refresh token at startup redirects to Cognito', async () => {
  const ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'expired', expiresAt: 0, refreshToken: 'expired-refresh' }));
  globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) });
  assert.equal(await ctx.auth.initializeAuth(), false);
  assert.equal(ctx.storage.has(tokenKey), false);
  assert.equal(ctx.redirects[0].pathname, '/oauth2/authorize');
});

test('another tab removing persisted tokens prevents an in-flight refresh restoring the session', async () => {
  const ctx = await setup();
  ctx.storage.set(tokenKey, JSON.stringify({ accessToken: 'old', expiresAt: 0, refreshToken: 'refresh' }));
  let resolve;
  globalThis.fetch = () => new Promise((done) => { resolve = done; });
  const pending = ctx.auth.ensureAccessToken();
  ctx.storage.delete(tokenKey);
  resolve({ ok: true, json: async () => ({ access_token: 'new', id_token: idToken(), token_type: 'Bearer', expires_in: 3600 }) });
  assert.equal(await pending, null);
  assert.equal(ctx.storage.has(tokenKey), false);
});


test('cross-tab lock reuses rotated tokens instead of refreshing twice', async () => {
  const first = await setup();
  first.storage.set(tokenKey, JSON.stringify({ accessToken: 'old', expiresAt: 0, refreshToken: 'refresh' }));
  const second = await setup(first.storage, 'http://localhost:5173/', new Map());
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let queue = Promise.resolve();
  let locks = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
    request: (name, callback) => {
      assert.equal(name, 'morning-duty.auth.refresh');
      locks++;
      queue = queue.then(callback);
      return queue;
    },
  } } });
  try {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return { ok: true, json: async () => ({ access_token: 'new', id_token: idToken(), token_type: 'Bearer', expires_in: 3600, refresh_token: 'rotated' }) };
    };
    assert.deepEqual(await Promise.all([first.auth.ensureAccessToken(), second.auth.ensureAccessToken()]), ['new', 'new']);
    assert.equal(calls, 1);
    assert.equal(locks, 2);
    assert.equal(JSON.parse(first.storage.get(tokenKey)).refreshToken, 'rotated');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
    else delete globalThis.navigator;
  }
});

test('storage logout event clears this tab and goes through Cognito logout', async () => {
  const ctx = await setup();
  storedToken(ctx.storage);
  ctx.storage.delete(tokenKey);
  const event = new Event('storage');
  Object.defineProperty(event, 'key', { value: tokenKey });
  window.dispatchEvent(event);
  assert.equal(ctx.auth.getAccessToken(), null);
  assert.equal(ctx.redirects[0].pathname, '/logout');
});
