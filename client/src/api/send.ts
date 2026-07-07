import type { SendRequestBody, SendResult, PrepareResult } from '../types';

export async function sendRequest(body: SendRequestBody): Promise<SendResult> {
  const r = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function prepareRequest(body: SendRequestBody): Promise<PrepareResult> {
  const r = await fetch('/api/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}
