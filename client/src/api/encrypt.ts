import type { EncryptResult } from '../types';

export async function encryptPayload(body: {
  payload: string;
  publicKey?: string;
  cardType?: string;
  keyLength: number;
  mode: string;
  algorithm?: string;
  oaepDigest?: string;
  moduleId: string;
}): Promise<EncryptResult> {
  const r = await fetch('/api/encrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}
