const router = require('express').Router();
const { loadConfig }                                                   = require('../db');
const { generateDesKey, buildAsnWrappedKey, encryptRSA, encryptPayload, decryptDES } = require('../crypto/des');
const { encryptPayloadAES, decryptAES }                                = require('../crypto/aes');
const { buildPinBlockHex, encryptDESRaw }                              = require('../crypto/pin');

// ─── POST /api/encrypt ────────────────────────────────────────────────────────

router.post('/api/encrypt', async (req, res) => {
  try {
    const {
      payload, cardType,
      algorithm: algIn, keyLength: klIn, mode: modeIn, ivHex: ivIn, oaepDigest: oaepIn,
    } = req.body || {};
    let { publicKey } = req.body || {};

    if (!payload) return res.status(400).json({ ok: false, error: 'payload is required' });

    const cfg       = await loadConfig();
    const algorithm = String(algIn || cfg.encryption?.algorithm || 'DES').toUpperCase();
    const isAES     = algorithm === 'AES';

    if (!publicKey && cardType) {
      const ct = cfg.cardTypes?.[cardType];
      if (!ct) return res.status(400).json({ ok: false, error: `Unknown cardType: ${cardType}` });
      publicKey = isAES ? (ct.aesPublicKey || ct.publicKey) : ct.publicKey;
      if (!publicKey) return res.status(400).json({ ok: false, error: `cardType "${cardType}" has no ${isAES ? 'aesPublicKey' : 'publicKey'} configured` });
    }
    if (!publicKey) return res.status(400).json({ ok: false, error: 'publicKey (or cardType) is required' });

    try { JSON.parse(payload); } catch (e) { return res.status(400).json({ ok: false, error: `Payload is not valid JSON: ${e.message}` }); }

    const cleanKey = String(publicKey).replace(/\s+/g, '');

    if (isAES) {
      const keyLength  = Number(klIn   || cfg.encryption?.aesKeyLength || 256);
      const oaepDigest = String(oaepIn || cfg.encryption?.oaepDigest   || 'NONE').toUpperCase();
      const enc = encryptPayloadAES(payload, cleanKey, keyLength, oaepDigest);
      return res.json({ ok: true, algorithm: 'AES', body: enc.body, aesKeyHex: enc.aesKeyHex, ivHex: enc.ivHex, publicKeyFingerprint: enc.fingerprint, compactPayload: enc.compactPayload, keyLength, oaepDigest });
    }

    const keyLength = Number(klIn  || cfg.encryption?.keyLength || 168);
    const mode      = (modeIn      || cfg.encryption?.mode      || 'STRING').toUpperCase();
    const ivHex     =  ivIn        || cfg.encryption?.ivHex     || '99999999999999999999999999999999';
    const enc = encryptPayload(payload, cleanKey, keyLength, mode, ivHex);
    res.json({ ok: true, algorithm: 'DES', body: enc.body, desKeyHex: enc.desKeyHex, compactPayload: enc.compactPayload, keyLength, mode });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ─── POST /api/decrypt ────────────────────────────────────────────────────────

router.post('/api/decrypt', (req, res) => {
  try {
    const { ciphertext, desKeyHex, aesKeyHex, ivHex, mode, algorithm: algIn } = req.body || {};
    if (!ciphertext) return res.status(400).json({ ok: false, error: 'ciphertext is required' });

    const algorithm = String(algIn || (aesKeyHex ? 'AES' : 'DES')).toUpperCase();

    if (algorithm === 'AES') {
      if (!aesKeyHex) return res.status(400).json({ ok: false, error: 'aesKeyHex is required for AES' });
      const cleanKey = String(aesKeyHex).trim().replace(/\s+/g, '');
      if (!/^[0-9a-fA-F]+$/.test(cleanKey)) return res.status(400).json({ ok: false, error: 'AES key must be hex' });
      const aesKeyBuf = Buffer.from(cleanKey, 'hex');
      if (![16, 24, 32].includes(aesKeyBuf.length)) return res.status(400).json({ ok: false, error: `AES key must be 16/24/32 bytes (got ${aesKeyBuf.length})` });

      let cipherHex    = String(ciphertext).trim();
      let ivForResp    = ivHex;
      let extractedFrom = null;
      if (cipherHex.startsWith('{') || cipherHex.startsWith('[')) {
        try {
          const j = JSON.parse(cipherHex);
          if (j?.encryptedValue)  { cipherHex = j.encryptedValue; ivForResp = j.iv || ivForResp; extractedFrom = 'encryptedValue'; }
          else if (j?.data)       { cipherHex = j.data;           ivForResp = j.iv || ivForResp; extractedFrom = 'data'; }
          else return res.status(400).json({ ok: false, error: 'JSON pasted but no "encryptedValue" or "data" field found' });
        } catch (_) {}
      }
      if (!ivForResp) return res.status(400).json({ ok: false, error: 'ivHex is required for AES (or paste full JSON with "iv")' });
      const ivBuf = Buffer.from(String(ivForResp).replace(/\s+/g, ''), 'hex');
      if (ivBuf.length !== 16) return res.status(400).json({ ok: false, error: `AES IV must be 16 bytes (got ${ivBuf.length})` });

      const decrypted = decryptAES(Buffer.from(cipherHex.replace(/\s+/g, ''), 'hex'), aesKeyBuf, ivBuf).toString('utf8');
      let parsed = null;
      try { parsed = JSON.parse(decrypted); } catch (_) {}
      return res.json({ ok: true, algorithm: 'AES', decrypted, parsed, extractedFrom });
    }

    // DES
    if (!desKeyHex) return res.status(400).json({ ok: false, error: 'desKeyHex is required' });
    const m        = (mode || 'STRING').toUpperCase();
    const cleanKey = String(desKeyHex).trim().replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(cleanKey)) return res.status(400).json({ ok: false, error: 'DES key must be hex' });
    const desKeyBuf = Buffer.from(cleanKey, 'hex');
    if (![16, 24].includes(desKeyBuf.length)) return res.status(400).json({ ok: false, error: `DES key must be 16 or 24 bytes (got ${desKeyBuf.length})` });

    let cipher = String(ciphertext).trim();
    let extractedFrom = null;
    if (cipher.startsWith('{') || cipher.startsWith('[')) {
      try {
        const j = JSON.parse(cipher);
        if (j?.data)                             { cipher = j.data;                  extractedFrom = 'data'; }
        else if (j?.cards?.[0]?.cardData)        { cipher = j.cards[0].cardData;     extractedFrom = 'cards[0].cardData'; }
        else return res.status(400).json({ ok: false, error: 'JSON pasted but no "data" or "cards[0].cardData" field found' });
      } catch (_) { /* treat as raw cipher */ }
    }

    const decrypted = decryptDES(cipher, desKeyBuf, m);
    let parsed = null;
    try { parsed = JSON.parse(decrypted); } catch (_) {}
    res.json({ ok: true, algorithm: 'DES', decrypted, parsed, extractedFrom });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ─── POST /api/pin/encrypt ────────────────────────────────────────────────────

router.post('/api/pin/encrypt', async (req, res) => {
  try {
    const { deviceNumber, clearPin, cardType, keyLength: klIn, mode: modeIn, ivHex: ivIn } = req.body || {};
    let { publicKey } = req.body || {};

    if (!deviceNumber) return res.status(400).json({ ok: false, error: 'deviceNumber is required' });
    if (!clearPin)     return res.status(400).json({ ok: false, error: 'clearPin is required' });
    const pin = String(clearPin);
    if (!/^\d+$/.test(pin))               return res.status(400).json({ ok: false, error: 'PIN must be numeric' });
    if (pin.length < 4 || pin.length > 6) return res.status(400).json({ ok: false, error: 'PIN must be 4 to 6 digits (ISO-0)' });

    let cfgEnc = null;
    if (!publicKey && cardType) {
      const cfg = await loadConfig();
      cfgEnc    = cfg.encryption || null;
      const ct  = cfg.cardTypes?.[cardType];
      if (!ct)           return res.status(400).json({ ok: false, error: `Unknown cardType: ${cardType}` });
      if (!ct.publicKey) return res.status(400).json({ ok: false, error: `cardType "${cardType}" has no publicKey configured` });
      publicKey = ct.publicKey;
    }
    if (!publicKey) return res.status(400).json({ ok: false, error: 'publicKey (or cardType) is required' });

    const keyLength = Number(klIn || 112);
    const mode      = (modeIn || 'HEX').toUpperCase();
    let ivHex       = ivIn;
    if (!ivHex) {
      if (!cfgEnc) { try { cfgEnc = (await loadConfig()).encryption || null; } catch (_) {} }
      ivHex = cfgEnc?.ivHex || '99999999999999999999999999999999';
    }

    const pinBlockClear = buildPinBlockHex(pin, String(deviceNumber));
    const desKeyBuf     = generateDesKey(keyLength);
    const desKeyHex     = desKeyBuf.toString('hex').toUpperCase();
    const encBuf        = encryptDESRaw(Buffer.from(pinBlockClear, 'hex'), desKeyBuf);
    const data          = mode === 'HEX' ? encBuf.toString('hex').toUpperCase() : encBuf.toString('base64');
    const asnHex        = buildAsnWrappedKey(desKeyHex, keyLength, ivHex);
    const cleanKey      = String(publicKey).replace(/\s+/g, '');
    const encKey        = encryptRSA(asnHex, cleanKey, mode);

    res.json({ ok: true, pinBlockClear, desKeyHex, asnHex, oldSourceBlock: data, oldSourceEncKey: encKey, body: { oldSourceBlock: data, oldSourceEncKey: encKey }, keyLength, mode });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

module.exports = router;
