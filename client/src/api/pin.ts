import type { PinEncryptResult } from '../types';

export async function encryptPin(body: {
  deviceNumber: string;
  clearPin: string;
  publicKey?: string;
  cardType?: string;
  keyLength: number;
  mode: string;
  ivHex?: string;
  moduleId: string;
}): Promise<PinEncryptResult> {
  const r = await fetch('/api/pin/encrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}
