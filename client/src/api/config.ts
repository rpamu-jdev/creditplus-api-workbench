import type { AppConfig } from '../types';

export async function fetchConfig(): Promise<AppConfig> {
  const r = await fetch('/api/config');
  if (!r.ok) throw new Error(`Config fetch failed: ${r.status}`);
  return r.json();
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const r = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `Save failed: ${r.status}`);
  }
}

export async function resetConfig(): Promise<AppConfig> {
  const r = await fetch('/api/config/reset', { method: 'POST' });
  if (!r.ok) throw new Error(`Reset failed: ${r.status}`);
  const j = await r.json();
  return j.config;
}
