import type { LogEntry } from '../types';

interface LogsResponse {
  ok: boolean;
  logs: LogEntry[];
  count: number;
  limit: number;
  error?: string;
}

export async function fetchLogs(params: {
  limit?: number;
  cardType?: string;
  phase?: string;
  moduleId?: string;
}): Promise<LogsResponse> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cardType) qs.set('cardType', params.cardType);
  if (params.phase) qs.set('phase', params.phase);
  if (params.moduleId) qs.set('moduleId', params.moduleId);
  const r = await fetch(`/api/logs?${qs}`);
  return r.json();
}

export async function deleteLogs(): Promise<{ ok: boolean; deleted: number }> {
  const r = await fetch('/api/logs', { method: 'DELETE' });
  return r.json();
}
