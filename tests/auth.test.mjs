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
async function setup(storage = new Map(), href = 'http://localhost:5173/') {
  const redirects = [];
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = new EventTarget();
  window.location = { href, replace: (url) => redirects.push(new URL(url)) };
  window.history = { state: null, replaceState: (_, __, url) => { window.location.href = new URL(url, href).href; } };
  const source = (await readFile(new URL('../src/auth/cognito.js', import.meta.url), 'utf8'))
    .replace('import.meta.env', JSON.stringify(env));
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source + `\n// ${moduleId++}`).toString('base64')}`;
  const auth = await import(moduleUrl);
  return { auth, storage, redirects, moduleUrl };
}
function storedToken(storage) {
  storage.set(tokenKey, JSON.stringify({ accessToken: 'test-access', expiresAt: Date.now() + 3600000 }));
}
async function loginCallback(storage, state) {
  return setup(storage, `http://localhost:5173/?code=test-code&state=${state}&keep=yes`);
}

test('PKCE S256, state, one-use exchange, callback cleanup and session reload', async () => {
  let ctx = await setup();
  assert.equal(await ctx.auth.initializeAuth(), false);
  const request = ctx.redirects[0].searchParams;
  const tx = JSON.parse(ctx.storage.get(pkceKey));
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
    return { ok: true, json: async () => ({ access_token: 'test-access', token_type: 'Bearer', expires_in: 3600, id_token: 'unused-id', refresh_token: 'unused-refresh' }) };
  };
  assert.deepEqual(await Promise.all([ctx.auth.initializeAuth(), ctx.auth.initializeAuth()]), [true, true]);
  assert.equal(exchanges, 1);
  assert.equal(window.location.href, 'http://localhost:5173/?keep=yes');
  assert.equal(ctx.storage.has(pkceKey), false);
  assert.equal(ctx.auth.getAccessToken(), 'test-access');
  assert.equal(JSON.stringify([...ctx.storage]).includes('unused-'), false);
  ctx = await setup(ctx.storage);
  assert.equal(await ctx.auth.initializeAuth(), true);
  assert.equal(ctx.redirects.length, 0);
});

test('invalid/missing/expired state and provider/token errors never authenticate or loop', async () => {
  for (const kind of ['wrong', 'missing', 'expired', 'provider', 'exchange']) {
    let ctx = await setup();
    await ctx.auth.initializeAuth();
    const tx = JSON.parse(ctx.storage.get(pkceKey));
    if (kind === 'missing') ctx.storage.delete(pkceKey);
    if (kind === 'expired') ctx.storage.set(pkceKey, JSON.stringify({ ...tx, createdAt: Date.now() - 700000 }));
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
  const first = JSON.parse(ctx.storage.get(pkceKey));
  ctx = await setup(ctx.storage);
  storedToken(ctx.storage);
  await ctx.auth.recoverAuthentication();
  assert.equal(ctx.redirects.length, 0);
  assert.equal(ctx.auth.getAccessToken(), null);
  await ctx.auth.retryLogin();
  assert.equal(ctx.redirects.length, 1);
  const second = JSON.parse(ctx.storage.get(pkceKey));
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
