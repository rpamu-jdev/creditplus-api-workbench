export interface CardType {
  label: string;
  baseUrl: string;
  oauthBaseUrl?: string;
  publicKey: string;
  aesPublicKey?: string;
  headers: Record<string, string>;
  endpoints: Endpoint[];
}

export interface Endpoint {
  path: string;
  samples: Sample[];
  headers: Record<string, string>;
  requiresPinBlock?: boolean;
  id?: string;
  name?: string;
}

export interface Sample {
  name: string;
  payload: string;
}

export interface EncryptionConfig {
  algorithm: 'DES' | 'AES';
  keyLength: number;
  mode: 'STRING' | 'HEX';
  ivHex: string;
  aesKeyLength: number;
  oaepDigest: 'NONE' | 'SHA256' | 'SHA512';
}

export interface OAuthConfig {
  baseUrl?: string;
  tokenUrl: string;
  refreshUrl: string;
  username: string;
  apiKey: string;
}

export interface AppConfig {
  cardTypes: Record<string, CardType>;
  encryption: EncryptionConfig;
  oauth: OAuthConfig;
}

export interface OAuthTokenInfo {
  present: boolean;
  accessToken?: string;
  tokenType?: string;
  obtainedAt?: string;
  expiresAt?: string;
  expiresInSec?: number | null;
  expired?: boolean;
}

export interface SendRequestBody {
  cardType: string;
  endpoint: string;
  payload: string;
  encrypt: boolean;
  updateTimestamp: boolean;
  extraHeaders?: string;
  extraBodyFields?: string;
  oauth: boolean;
  clearPin?: string;
  correlationId?: string;
  algorithm?: string;
  keyLength?: number;
  mode?: string;
  oaepDigest?: string;
  moduleId: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
  trace?: TraceRecord;
}

export interface TraceRecord {
  url: string;
  correlationId: string;
  encrypt: boolean;
  oauth: boolean;
  algorithm?: string;
  keyLength?: number;
  mode?: string;
  timestampUsed?: string;
  httpStatus?: number;
  elapsedMs?: number;
  desKeyHex?: string;
  aesKeyHex?: string;
  rawPayload?: string;
  encryptedBody?: unknown;
  requestHeaders?: Record<string, string>;
  encryptedResponse?: string;
  decryptedResponse?: unknown;
  oauthToken?: OAuthTokenInfo;
  cardType?: string;
  endpoint?: string;
  method?: string;
  fullUrl?: string;
}

export interface PrepareResult {
  ok: boolean;
  error?: string;
  fullUrl?: string;
  headers?: Record<string, string>;
  body?: string;
  encryptedBody?: unknown;
  rawPayload?: string;
  compactPayload?: string;
  encrypt?: boolean;
  oauth?: boolean;
  algorithm?: string;
  keyLength?: number;
  mode?: string;
  oaepDigest?: string;
  desKeyHex?: string;
  aesKeyHex?: string;
  aesIvHex?: string;
  publicKeyFingerprint?: string;
  timestampUsed?: string;
  correlationId?: string;
  oauthToken?: OAuthTokenInfo;
}

export interface EncryptResult {
  ok: boolean;
  error?: string;
  body?: { data: string; encKey: string };
  desKeyHex?: string;
  compactPayload?: string;
}

export interface DecryptResult {
  ok: boolean;
  error?: string;
  decrypted?: string;
  parsed?: unknown;
  extractedFrom?: string;
}

export interface PinEncryptResult {
  ok: boolean;
  error?: string;
  oldSourceBlock?: string;
  oldSourceEncKey?: string;
  body?: { oldSourceBlock: string; oldSourceEncKey: string };
  pinBlockClear?: string;
  desKeyHex?: string;
  asnHex?: string;
}

export interface LogEntry {
  _id: string;
  timestamp: string;
  cardType?: string;
  endpoint?: string;
  phase?: string;
  fullUrl?: string;
  correlationId?: string;
  encrypt?: boolean;
  keyLength?: number;
  mode?: string;
  timestampUsed?: string;
  httpStatus?: number;
  elapsedMs?: number;
  error?: string;
  requestHeaders?: unknown;
  compactPayload?: string;
  rawPayload?: string;
  encryptedRequestBody?: unknown;
  desKeyHex?: string;
  responseHeaders?: unknown;
  encryptedResponse?: unknown;
  decryptedResponse?: unknown;
}
