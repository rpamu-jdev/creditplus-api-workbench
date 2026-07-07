import type { OAuthTokenInfo } from '../types';

interface OAuthStatusResponse {
  ok: boolean;
  token: OAuthTokenInfo;
}

export async function fetchOAuthStatus(moduleId: string): Promise<OAuthTokenInfo> {
  const r = await fetch(`/api/oauth/status?m=${encodeURIComponent(moduleId)}`);
  const j: OAuthStatusResponse = await r.json();
  return j.token;
}

export async function fetchOAuthToken(moduleId: string): Promise<OAuthTokenInfo> {
  const r = await fetch('/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId }),
  });
  const j: OAuthStatusResponse = await r.json();
  if (!j.ok) throw new Error((j as unknown as { error?: string }).error || 'Token fetch failed');
  return j.token;
}

export async function refreshOAuthToken(moduleId: string): Promise<OAuthTokenInfo> {
  const r = await fetch('/api/oauth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId }),
  });
  const j: OAuthStatusResponse = await r.json();
  if (!j.ok) throw new Error((j as unknown as { error?: string }).error || 'Refresh failed');
  return j.token;
}

export async function clearOAuthToken(moduleId: string): Promise<void> {
  await fetch('/api/oauth/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId }),
  });
}
