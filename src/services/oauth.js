const { loadModule } = require('../db/modules');
const { httpRequest } = require('./http');

// In-memory token cache keyed by moduleId — cleared on process restart (intentional for a testing tool)
const oauthTokens = new Map();

// ─── Config helpers ───────────────────────────────────────────────────────────

function oauthConfigFor(mod) {
  const o = (mod?.config?.oauth) || {};
  return {
    tokenUrl:   String(o.tokenUrl   || '').trim(),
    refreshUrl: String(o.refreshUrl || '').trim(),
    username:   String(o.username   || ''),
    apiKey:     String(o.apiKey     || ''),
  };
}

function storeOauthToken(moduleId, j) {
  const raw = j?.token ?? j?.access_token;
  if (!raw) throw new Error('Token response missing "token" (or "access_token")');
  const expiresInMs = (Number(j.expires_in) || 0) * 1000;
  const prev = oauthTokens.get(moduleId);
  const tok  = {
    accessToken:  String(raw),
    refreshToken: j.refresh_token ? String(j.refresh_token) : (prev?.refreshToken ?? null),
    tokenType:    String(j.token_type || 'Bearer'),
    obtainedAt:   Date.now(),
    expiresAt:    expiresInMs ? Date.now() + expiresInMs : null,
  };
  oauthTokens.set(moduleId, tok);
  return tok;
}

// ─── Token operations ─────────────────────────────────────────────────────────

async function oauthFetchToken(moduleId) {
  const mod = await loadModule(moduleId);
  const o   = oauthConfigFor(mod);
  if (!o.tokenUrl)              throw new Error('OAuth tokenUrl is not configured (Configuration → OAuth)');
  if (!o.username || !o.apiKey) throw new Error('OAuth username/apiKey are not configured (Configuration → OAuth)');
  const resp = await httpRequest({
    fullUrl: o.tokenUrl, method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username: o.username, apiKey: o.apiKey }),
  });
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`Token request failed: HTTP ${resp.status} ${(resp.text || '').slice(0, 300)}`);
  }
  return storeOauthToken(moduleId, resp.json || {});
}

async function oauthRefreshToken(moduleId) {
  const mod    = await loadModule(moduleId);
  const o      = oauthConfigFor(mod);
  const cached = oauthTokens.get(moduleId);
  if (!o.refreshUrl)             throw new Error('OAuth refreshUrl is not configured (Configuration → OAuth)');
  if (!cached?.refreshToken)     throw new Error('No refresh token available — get a token first');
  const resp = await httpRequest({
    fullUrl: o.refreshUrl, method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh_token: cached.refreshToken }),
  });
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`Token refresh failed: HTTP ${resp.status} ${(resp.text || '').slice(0, 300)}`);
  }
  return storeOauthToken(moduleId, resp.json || {});
}

async function oauthEnsureToken(moduleId, { forceRefresh = false } = {}) {
  const cached  = oauthTokens.get(moduleId);
  if (!cached) return oauthFetchToken(moduleId);
  const expired = cached.expiresAt && Date.now() >= (cached.expiresAt - 5000);
  if (forceRefresh || expired) {
    if (cached.refreshToken) {
      try { return await oauthRefreshToken(moduleId); }
      catch (_) { return oauthFetchToken(moduleId); }
    }
    return oauthFetchToken(moduleId);
  }
  return cached;
}

function oauthTokenInfo(moduleId) {
  const t = oauthTokens.get(moduleId);
  if (!t) return { present: false };
  const now = Date.now();
  return {
    present:         true,
    tokenType:       t.tokenType,
    accessToken:     t.accessToken,
    hasRefreshToken: !!t.refreshToken,
    obtainedAt:      new Date(t.obtainedAt).toISOString(),
    expiresAt:       t.expiresAt ? new Date(t.expiresAt).toISOString() : null,
    expiresInSec:    t.expiresAt ? Math.max(0, Math.round((t.expiresAt - now) / 1000)) : null,
    expired:         t.expiresAt ? now >= t.expiresAt : false,
  };
}

function clearToken(moduleId) {
  oauthTokens.delete(moduleId);
}

function maskAuthHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === 'authorization') {
      const s  = String(v);
      const sp = s.indexOf(' ');
      out[k] = sp > 0 ? `${s.slice(0, sp + 1)}***` : '***';
    } else {
      out[k] = v;
    }
  }
  return out;
}

module.exports = {
  oauthFetchToken,
  oauthRefreshToken,
  oauthEnsureToken,
  oauthTokenInfo,
  clearToken,
  maskAuthHeaders,
};
