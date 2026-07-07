const crypto = require('crypto');

// ─── Key generation ───────────────────────────────────────────────────────────

function generateAesKey(bitLength) {
  const bits = Number(bitLength);
  if (![128, 192, 256].includes(bits)) throw new Error(`Unsupported AES key length: ${bitLength}`);
  return crypto.randomBytes(bits / 8);
}

function aesAlgoFor(keyBuf) {
  if (keyBuf.length === 16) return 'aes-128-cbc';
  if (keyBuf.length === 24) return 'aes-192-cbc';
  if (keyBuf.length === 32) return 'aes-256-cbc';
  throw new Error(`Unsupported AES key length: ${keyBuf.length} bytes`);
}

// ─── AES-CBC encrypt / decrypt ────────────────────────────────────────────────

function encryptAES(plaintextStr, aesKeyBuf, ivBuf) {
  const cipher = crypto.createCipheriv(aesAlgoFor(aesKeyBuf), aesKeyBuf, ivBuf);
  return Buffer.concat([cipher.update(plaintextStr, 'utf8'), cipher.final()]);
}

function decryptAES(cipherBuf, aesKeyBuf, ivBuf) {
  const decipher = crypto.createDecipheriv(aesAlgoFor(aesKeyBuf), aesKeyBuf, ivBuf);
  return Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
}

// ─── RSA key wrapping (AES flow — supports PKCS#1 v1.5 + OAEP-SHA256/512) ───

function publicKeyPem(publicKeyB64) {
  return '-----BEGIN PUBLIC KEY-----\n' +
    publicKeyB64.match(/.{1,64}/g).join('\n') +
    '\n-----END PUBLIC KEY-----\n';
}

function computePublicKeyFingerprint(publicKeyB64) {
  return crypto.createHash('sha256').update(Buffer.from(publicKeyB64, 'base64')).digest('hex').toUpperCase();
}

function wrapAesKeyUnderRSA(aesKeyBuf, publicKeyB64, oaepDigest) {
  const digest = String(oaepDigest || 'NONE').toUpperCase();
  const opts   = { key: publicKeyPem(publicKeyB64) };
  if (digest === 'NONE') {
    opts.padding = crypto.constants.RSA_PKCS1_PADDING;
  } else if (digest === 'SHA256') {
    opts.padding  = crypto.constants.RSA_PKCS1_OAEP_PADDING;
    opts.oaepHash = 'sha256';
  } else if (digest === 'SHA512') {
    opts.padding  = crypto.constants.RSA_PKCS1_OAEP_PADDING;
    opts.oaepHash = 'sha512';
  } else {
    throw new Error(`Unsupported oaepPaddingDigestAlgorithm: ${digest}`);
  }
  return crypto.publicEncrypt(opts, aesKeyBuf);
}

// ─── End-to-end AES payload encryption ───────────────────────────────────────

function encryptPayloadAES(payloadStr, publicKeyB64, aesKeyBits, oaepDigest) {
  const compact      = JSON.stringify(JSON.parse(payloadStr));
  const aesKey       = generateAesKey(aesKeyBits);
  const iv           = crypto.randomBytes(16);
  const encryptedVal = encryptAES(compact, aesKey, iv);
  const encryptedKey = wrapAesKeyUnderRSA(aesKey, publicKeyB64, oaepDigest);
  const fingerprint  = computePublicKeyFingerprint(publicKeyB64);
  const digest       = String(oaepDigest || 'NONE').toUpperCase();
  return {
    body: {
      publicKeyFingerprint:       fingerprint,
      oaepPaddingDigestAlgorithm: digest,
      iv:                         iv.toString('hex').toUpperCase(),
      encryptedKey:               encryptedKey.toString('hex').toUpperCase(),
      encryptedValue:             encryptedVal.toString('hex').toUpperCase(),
    },
    aesKeyHex:      aesKey.toString('hex').toUpperCase(),
    ivHex:          iv.toString('hex').toUpperCase(),
    fingerprint,
    compactPayload: compact,
  };
}

// ─── AES response decryption ──────────────────────────────────────────────────

function decryptAESResponse(respJson, aesKeyHex, ivHex) {
  try {
    if (!respJson || typeof respJson !== 'object') return null;
    const cipherHex = respJson.encryptedValue || respJson.data;
    const ivForResp = respJson.iv || ivHex;
    if (!cipherHex || !ivForResp) return null;
    return decryptAES(
      Buffer.from(cipherHex, 'hex'),
      Buffer.from(aesKeyHex, 'hex'),
      Buffer.from(ivForResp, 'hex'),
    ).toString('utf8');
  } catch (e) {
    return `Decryption failed: ${e.message}`;
  }
}

module.exports = {
  generateAesKey,
  aesAlgoFor,
  encryptAES,
  decryptAES,
  publicKeyPem,
  computePublicKeyFingerprint,
  wrapAesKeyUnderRSA,
  encryptPayloadAES,
  decryptAESResponse,
};
