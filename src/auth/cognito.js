const env = import.meta.env;
const TOKEN = 'morning-duty.auth.token';
const TRANSACTION = 'morning-duty.auth.pkce';
const RECOVERY = 'morning-duty.auth.recovery';
const BLOCKED = 'morning-duty.auth.blocked';
export const AUTH_EVENT = 'morning-duty-auth-change';
let initialization;
let redirecting = false;
let refreshing;
let credentialVersion = 0;

function config() {
  const domain = env.VITE_COGNITO_DOMAIN;
  const clientId = env.VITE_COGNITO_CLIENT_ID;
  const redirectUri = env.VITE_COGNITO_REDIRECT_URI;
  const logoutUri = env.VITE_COGNITO_LOGOUT_URI;
  if (!domain || !clientId || !redirectUri || !logoutUri) throw new Error('AUTH_CONFIG_MISSING');
  return { domain, clientId, redirectUri, logoutUri };
}

function read(key) {
  try { return JSON.parse((key === TOKEN ? localStorage : sessionStorage).getItem(key)); } catch { return null; }
}

function cleanCallback() {
  const url = new URL(window.location.href);
  for (const key of ['code', 'state', 'error', 'error_description']) url.searchParams.delete(key);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

function announce(status) {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: status }));
}

function clearCredentials() {
  credentialVersion++;
  localStorage.removeItem(TOKEN);
  sessionStorage.removeItem(TOKEN);
  sessionStorage.removeItem(TRANSACTION);
}

function block() {
  clearCredentials();
  sessionStorage.setItem(BLOCKED, '1');
  announce('error');
}

export function getAccessToken() {
  const saved = read(TOKEN);
  if (typeof saved?.accessToken === 'string' && saved.accessToken && saved.expiresAt > Date.now() + 30000) {
    return saved.accessToken;
  }
  return null;
}

// Decode exp only to schedule renewal; API Gateway validates the Access Token.
function idExpiry(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '='))).exp;
    return Number.isFinite(exp) ? exp * 1000 : 0;
  } catch { return 0; }
}

function idIsCurrent(saved) {
  return saved?.idToken && saved.idExpiresAt > Date.now() + 30000;
}

function saveTokens(data, refreshToken) {
  if (typeof data.access_token !== 'string' || !data.access_token || data.token_type?.toLowerCase() !== 'bearer'
    || !Number.isFinite(data.expires_in) || data.expires_in <= 30) throw new Error('AUTH_TOKEN_INVALID');
  if (!idExpiry(data.id_token) || idExpiry(data.id_token) <= Date.now() + 30000) throw new Error('AUTH_TOKEN_INVALID');
  localStorage.setItem(TOKEN, JSON.stringify({ accessToken: data.access_token,
    idToken: data.id_token, idExpiresAt: idExpiry(data.id_token),
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: typeof data.refresh_token === 'string' && data.refresh_token ? data.refresh_token : refreshToken }));
}

export async function ensureAccessToken(rejectedToken) {
  if (redirecting) return null;
  const current = getAccessToken();
  if (current && current !== rejectedToken && idIsCurrent(read(TOKEN))) return current;
  if (refreshing) return refreshing;
  const refresh = async () => {
    // Re-read after acquiring the cross-tab lock: another tab may have rotated the token.
    const saved = read(TOKEN);
    const token = getAccessToken();
    if (token && token !== rejectedToken && idIsCurrent(saved)) return token;
    if (!saved?.refreshToken || redirecting) return null;
    const version = credentialVersion;
    const snapshot = localStorage.getItem(TOKEN);
    const unchanged = () => version === credentialVersion && localStorage.getItem(TOKEN) === snapshot;
    const { domain, clientId } = config();
    const response = await fetch(new URL('/oauth2/token', domain), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: clientId, refresh_token: saved.refreshToken }),
      credentials: 'omit', signal: AbortSignal.timeout(15000),
    });
    if (!unchanged()) return getAccessToken();
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (!unchanged()) return getAccessToken();
      if (response.status === 400 && error.error === 'invalid_grant') { clearCredentials(); return null; }
      throw new Error('AUTH_REFRESH_FAILED');
    }
    const data = await response.json();
    if (!unchanged()) return getAccessToken();
    saveTokens(data, saved.refreshToken);
    return getAccessToken();
  };
  refreshing = globalThis.navigator?.locks
    ? navigator.locks.request('morning-duty.auth.refresh', refresh)
    : refresh();
  try { return await refreshing; } finally { refreshing = undefined; }
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function login() {
  if (redirecting) return;
  redirecting = true;
  announce('loading');
  try {
    const { domain, clientId, redirectUri } = config();
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    sessionStorage.setItem(TRANSACTION, JSON.stringify({ verifier, state, createdAt: Date.now(), redirectUri }));
    const url = new URL('/oauth2/authorize', domain);
    url.search = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
      scope: 'openid', state, code_challenge: challenge, code_challenge_method: 'S256' });
    window.location.replace(url.href);
  } catch {
    redirecting = false;
    block();
    throw new Error('AUTH_LOGIN_FAILED');
  }
}

async function initialize() {
  try {
    // Upgrade the previous tab-only session once; never leave a stale migration copy.
    const legacy = sessionStorage.getItem(TOKEN);
    if (legacy && !localStorage.getItem(TOKEN)) localStorage.setItem(TOKEN, legacy);
    sessionStorage.removeItem(TOKEN);
    const params = new URL(window.location.href).searchParams;
    if (params.has('error')) throw new Error('AUTH_CALLBACK_FAILED');
    if (params.has('code')) {
      const transaction = read(TRANSACTION);
      const { domain, clientId, redirectUri } = config();
      if (!transaction || !transaction.state || transaction.state !== params.get('state')
        || !transaction.verifier || transaction.redirectUri !== redirectUri
        || !Number.isFinite(transaction.createdAt) || Date.now() - transaction.createdAt > 600000
        || transaction.createdAt > Date.now() || params.getAll('code').length !== 1
        || params.getAll('state').length !== 1 || !params.get('code')) throw new Error('AUTH_STATE_INVALID');
      sessionStorage.removeItem(TRANSACTION);
      const body = new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId,
        redirect_uri: redirectUri, code: params.get('code'), code_verifier: transaction.verifier });
      cleanCallback();
      const response = await fetch(new URL('/oauth2/token', domain), {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
        credentials: 'omit', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('AUTH_EXCHANGE_FAILED');
      const data = await response.json();
      saveTokens(data);
      sessionStorage.removeItem(RECOVERY);
      sessionStorage.removeItem(BLOCKED);
      return true;
    }
    if (sessionStorage.getItem(BLOCKED)) throw new Error('AUTH_BLOCKED');
    if (await ensureAccessToken()) return true;
    await login();
    return false;
  } catch {
    cleanCallback();
    if (read(TOKEN)?.refreshToken) {
      initialization = undefined;
      announce('error');
      throw new Error('AUTH_REFRESH_FAILED');
    }
    block();
    throw new Error('AUTH_FAILED');
  }
}

// StrictMode must not redeem the same one-use authorization code twice.
export function initializeAuth() {
  initialization ??= initialize();
  return initialization;
}

export async function recoverAuthentication() {
  if (redirecting) return;
  clearCredentials();
  if (sessionStorage.getItem(RECOVERY) || sessionStorage.getItem(BLOCKED)) { block(); return; }
  // Avoid redirect loops until a successful callback, explicit retry, or logout.
  sessionStorage.setItem(RECOVERY, '1');
  try { await login(); } catch { /* login already published a safe error */ }
}

export async function retryLogin() {
  if (read(TOKEN)?.refreshToken) {
    announce('loading');
    try {
      if (await ensureAccessToken()) { initialization = Promise.resolve(true); announce('ready'); return; }
      await recoverAuthentication();
    } catch { announce('error'); }
    return;
  }
  clearCredentials();
  sessionStorage.removeItem(RECOVERY);
  sessionStorage.removeItem(BLOCKED);
  redirecting = false;
  try { await login(); } catch { /* no sensitive error objects reach the UI */ }
}

export function logout() {
  clearCredentials();
  sessionStorage.removeItem(RECOVERY);
  sessionStorage.removeItem(BLOCKED);
  announce('loading');
  try {
    const { domain, clientId, logoutUri } = config();
    const url = new URL('/logout', domain);
    url.search = new URLSearchParams({ client_id: clientId, logout_uri: logoutUri });
    redirecting = true;
    window.location.replace(url.href);
  } catch { block(); }
}

window.addEventListener('storage', (event) => {
  if ((event.key === TOKEN || event.key === null) && !read(TOKEN)) {
    credentialVersion++;
    sessionStorage.removeItem(TOKEN);
    initialization = undefined;
    logout();
  }
});
