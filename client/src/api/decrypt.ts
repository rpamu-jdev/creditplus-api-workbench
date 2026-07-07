import type { DecryptResult } from '../types';

export async function decryptPayload(body: {
  ciphertext: string;
  algorithm: 'DES' | 'AES';
  desKeyHex?: string;
  mode?: string;
  aesKeyHex?: string;
  ivHex?: string;
}): Promise<DecryptResult> {
  const r = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}
