const crypto = require('crypto');

// ─── Key generation ───────────────────────────────────────────────────────────

function generateDesKey(keyLength) {
  // 168-bit → 24 bytes, 112-bit → 16 bytes  (keyLength / 7)
  return crypto.randomBytes(Math.floor(keyLength / 7));
}

function desAlgo(keyBuf) {
  if (keyBuf.length === 24) return 'des-ede3';
  if (keyBuf.length === 16) return 'des-ede';
  throw new Error(`Unsupported DES key length: ${keyBuf.length} bytes`);
}

// ─── Padding (NoPadding — pad with 'F' to 8-byte boundary) ──────────────────

function doPadding(data) {
  const rem = data.length % 8;
  return rem !== 0 ? data + 'F'.repeat(8 - rem) : data;
}

// ─── DES encrypt / decrypt ────────────────────────────────────────────────────

function encryptDES(plaintext, desKeyBuf, mode) {
  const padded = doPadding(plaintext);
  const cipher = crypto.createCipheriv(desAlgo(desKeyBuf), desKeyBuf, null);
  cipher.setAutoPadding(false);
  const enc = Buffer.concat([cipher.update(Buffer.from(padded, 'utf8')), cipher.final()]);
  return mode === 'HEX' ? enc.toString('hex').toUpperCase() : enc.toString('base64');
}

function decryptDES(b64OrHex, desKeyBuf, mode) {
  const enc = mode === 'HEX' ? Buffer.from(b64OrHex, 'hex') : Buffer.from(b64OrHex, 'base64');
  const decipher = crypto.createDecipheriv(desAlgo(desKeyBuf), desKeyBuf, null);
  decipher.setAutoPadding(false);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8').replace(/F+$/, '').replace(/\x00+$/, '');
}

// Raw-bytes variant — used for PIN block encryption (no padding, no mode conversion)
function encryptDESRaw(rawBytes, desKeyBuf) {
  const cipher = crypto.createCipheriv(desAlgo(desKeyBuf), desKeyBuf, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(rawBytes), cipher.final()]);
}

// ─── ASN.1 wrap + RSA-OAEP-SHA1 (DES flow) ───────────────────────────────────

function buildAsnWrappedKey(desKeyHex, keyLength, ivHex) {
  if (keyLength === 168) return '302C0418' + desKeyHex + '0410' + ivHex;
  return '30240410' + desKeyHex.substring(0, 32) + '0410' + ivHex;
}

function encryptRSA(asnHex, publicKeyB64, mode) {
  const pem = '-----BEGIN PUBLIC KEY-----\n' +
    publicKeyB64.match(/.{1,64}/g).join('\n') +
    '\n-----END PUBLIC KEY-----\n';
  const enc = crypto.publicEncrypt(
    { key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' },
    Buffer.from(asnHex, 'hex'),
  );
  return mode === 'STRING' ? enc.toString('base64') : enc.toString('hex').toUpperCase();
}

// ─── End-to-end DES payload encryption ───────────────────────────────────────

function encryptPayload(payloadStr, publicKeyB64, keyLength, mode, ivHex) {
  const desKeyBuf = generateDesKey(keyLength);
  const desKeyHex = desKeyBuf.toString('hex').toUpperCase();
  const compact   = JSON.stringify(JSON.parse(payloadStr));
  return {
    body:          { data: encryptDES(compact, desKeyBuf, mode), encKey: encryptRSA(buildAsnWrappedKey(desKeyHex, keyLength, ivHex), publicKeyB64, mode) },
    desKeyHex,
    compactPayload: compact,
  };
}

// ─── DES response decryption ──────────────────────────────────────────────────

function decryptResponse(respJson, desKeyHex, mode) {
  const desKeyBuf = Buffer.from(desKeyHex, 'hex');
  try {
    if (respJson?.data)                             return decryptDES(respJson.data, desKeyBuf, mode);
    if (Array.isArray(respJson?.cards) && respJson.cards[0]?.cardData)
      return decryptDES(respJson.cards[0].cardData, desKeyBuf, mode);
    return null;
  } catch (e) {
    return `Decryption failed: ${e.message}`;
  }
}

module.exports = {
  generateDesKey,
  doPadding,
  encryptDES,
  decryptDES,
  encryptDESRaw,
  buildAsnWrappedKey,
  encryptRSA,
  encryptPayload,
  decryptResponse,
};
