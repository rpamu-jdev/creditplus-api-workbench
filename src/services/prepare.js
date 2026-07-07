const { loadModule }                          = require('../db/modules');
const { encryptPayload, encryptDESRaw }        = require('../crypto/des');
const { encryptPayloadAES }                    = require('../crypto/aes');
const { buildPinBlockHex }                     = require('../crypto/pin');
const { oauthEnsureToken }                     = require('./oauth');
const { normalizeGenericConfig, normalizeEndpoint, findEndpoint, findRequestById, findRequestByPath } = require('../utils/normalize');
const { PTS_MODULE_ID }                        = require('../config');

// ─── Entry point ──────────────────────────────────────────────────────────────

async function prepareRequest(input) {
  const moduleId = input?.moduleId || PTS_MODULE_ID;
  const mod      = await loadModule(moduleId);
  return mod.kind === 'generic'
    ? prepareGenericRequest(mod, input)
    : preparePtsRequest(mod, input);
}

// ─── PTS (encrypted) module ───────────────────────────────────────────────────

async function preparePtsRequest(mod, input) {
  const cfg = mod.config || {};
  const {
    cardType,
    endpoint,
    correlationId    = '',
    encrypt          = false,
    algorithm:       algorithmIn,
    keyLength:       keyLengthIn,
    mode:            modeIn,
    oaepDigest:      oaepDigestIn,
    payload:         payloadIn = '{}',
    updateTimestamp  = true,
    extraHeaders     = {},
    extraBodyFields: extraBodyFieldsIn = {},
    oauth            = false,
    clearPin         = '',
  } = input || {};

  const extraBodyFields =
    (extraBodyFieldsIn && typeof extraBodyFieldsIn === 'object' && !Array.isArray(extraBodyFieldsIn))
      ? extraBodyFieldsIn : {};
  const hasExtraBodyFields = Object.keys(extraBodyFields).length > 0;

  const ct = cfg.cardTypes?.[cardType];
  if (!ct)       throw new Error(`Unknown cardType: ${cardType}`);
  if (!endpoint) throw new Error('endpoint is required');

  const epObj = findEndpoint(ct, endpoint); // null if endpoint typed manually

  const algorithm  = String(algorithmIn || cfg.encryption?.algorithm || 'DES').toUpperCase();
  const isAES      = algorithm === 'AES';
  const desKeyLen  = Number(keyLengthIn || cfg.encryption?.keyLength    || 168);
  const aesKeyLen  = Number(keyLengthIn || cfg.encryption?.aesKeyLength || 256);
  const keyLength  = isAES ? aesKeyLen : desKeyLen;
  const mode       = (modeIn || cfg.encryption?.mode || 'STRING').toUpperCase();
  const ivHex      = cfg.encryption?.ivHex || '99999999999999999999999999999999';
  const oaepDigest = String(oaepDigestIn || cfg.encryption?.oaepDigest || 'NONE').toUpperCase();

  // Optional timestamp replacement
  let payload       = String(payloadIn);
  let timestampUsed = null;
  if (updateTimestamp) {
    timestampUsed = String(Date.now());
    payload = payload.replace(/"timestamp"\s*:\s*"[^"]*"/, `"timestamp":"${timestampUsed}"`);
  }

  // URL construction
  const baseUrl      = (ct.baseUrl || '').replace(/\/+$/, '');
  const cleanEndpoint = String(endpoint).replace(/^\/+/, '');
  const useOAuth     = !!oauth;
  let fullUrl;
  if (useOAuth) {
    const oauthBase = (ct.oauthBaseUrl || '').replace(/\/+$/, '');
    fullUrl = oauthBase ? `${oauthBase}/${cleanEndpoint}` : `${baseUrl}/secure/${cleanEndpoint}`;
  } else {
    fullUrl = `${baseUrl}/${cleanEndpoint}`;
  }

  // Encryption
  let postBody             = null;
  let desKeyHex            = null;
  let aesKeyHex            = null;
  let aesIvHex             = null;
  let publicKeyFingerprint = null;
  let encryptedBodyObj     = null;
  let compactPayload       = null;
  let sourceBlockClearHex  = null;
  let sourceBlockEnc       = null;

  if (encrypt) {
    let payloadObj;
    try { payloadObj = JSON.parse(payload); }
    catch (e) { throw new Error(`Payload is not valid JSON: ${e.message}`); }

    if (isAES) {
      const aesKey = ct.aesPublicKey || ct.publicKey;
      if (!aesKey) throw new Error(`No AES RSA public key configured for cardType "${cardType}" (set "aesPublicKey" in Configuration)`);
      if (epObj?.requiresPinBlock) throw new Error('PIN-block endpoints are only supported with DES algorithm (per spec)');
      const enc            = encryptPayloadAES(payload, aesKey, aesKeyLen, oaepDigest);
      aesKeyHex            = enc.aesKeyHex;
      aesIvHex             = enc.ivHex;
      publicKeyFingerprint = enc.fingerprint;
      encryptedBodyObj     = enc.body;
      compactPayload       = enc.compactPayload;
    } else {
      if (!ct.publicKey) throw new Error(`No public key configured for cardType "${cardType}"`);
      const enc    = encryptPayload(payload, ct.publicKey, desKeyLen, mode, ivHex);
      desKeyHex    = enc.desKeyHex;
      compactPayload = enc.compactPayload;
      encryptedBodyObj = enc.body;

      if (epObj?.requiresPinBlock) {
        sourceBlockClearHex = buildPinBlockHex(clearPin, payloadObj.deviceNumber);
        const desKeyBuf     = Buffer.from(desKeyHex, 'hex');
        sourceBlockEnc      = encryptDESRaw(Buffer.from(sourceBlockClearHex, 'hex'), desKeyBuf).toString('hex').toUpperCase();
        // Order mirrors Java EncryptionProcessor: sourceBlock, data, encKey
        encryptedBodyObj    = { sourceBlock: sourceBlockEnc, data: enc.body.data, encKey: enc.body.encKey };
      }
    }

    if (hasExtraBodyFields) encryptedBodyObj = { ...encryptedBodyObj, ...extraBodyFields };
    postBody = JSON.stringify(encryptedBodyObj);
  } else {
    if (hasExtraBodyFields) {
      let payloadObj;
      try { payloadObj = JSON.parse(payload); }
      catch (e) { throw new Error(`Cannot merge extraBodyFields: payload is not valid JSON: ${e.message}`); }
      if (!payloadObj || typeof payloadObj !== 'object' || Array.isArray(payloadObj)) {
        throw new Error('extraBodyFields requires the payload to be a JSON object');
      }
      postBody = JSON.stringify({ ...payloadObj, ...extraBodyFields });
    } else {
      postBody = payload;
    }
  }

  // OAuth — fetch/refresh token and build Authorization header
  let authorizationHeader = null;
  let oauthTokenMeta      = null;
  if (useOAuth) {
    const tok           = await oauthEnsureToken(mod._id);
    authorizationHeader = `${tok.tokenType || 'Bearer'} ${tok.accessToken}`;
    oauthTokenMeta      = {
      tokenType:  tok.tokenType,
      obtainedAt: tok.obtainedAt ? new Date(tok.obtainedAt).toISOString() : null,
      expiresAt:  tok.expiresAt  ? new Date(tok.expiresAt).toISOString()  : null,
    };
  }

  // Header merge order (lowest → highest precedence):
  //   cardType.headers → endpoint.headers → extraHeaders → Correlation-ID
  const headers = {
    ...(ct.headers     || {}),
    ...(epObj?.headers || {}),
    ...extraHeaders,
    ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
    'Correlation-ID': correlationId,
  };

  return {
    moduleId:              mod._id,
    moduleKind:            mod.kind,
    method:                'POST',
    fullUrl,
    headers,
    body:                  postBody,
    encryptedBody:         encryptedBodyObj,
    algorithm,
    desKeyHex,
    aesKeyHex,
    aesIvHex,
    publicKeyFingerprint,
    oaepDigest,
    compactPayload,
    rawPayload:            payload,
    timestampUsed,
    encrypt:               !!encrypt,
    keyLength,
    mode,
    correlationId,
    sourceBlockClearHex,
    sourceBlockEncrypted:  sourceBlockEnc,
    requiresPinBlock:      !!epObj?.requiresPinBlock,
    extraBodyFields:       hasExtraBodyFields ? extraBodyFields : null,
    oauth:                 useOAuth,
    oauthToken:            oauthTokenMeta,
  };
}

// ─── Generic HTTP module (no encryption) ─────────────────────────────────────

async function prepareGenericRequest(mod, input) {
  const cfg = normalizeGenericConfig(mod.config || {});
  const {
    method:          methodIn,
    endpoint:        epPathIn,
    endpointId,
    payload:         payloadIn    = '',
    extraHeaders                  = {},
    correlationId                 = '',
    updateTimestamp               = false,
  } = input || {};

  const method  = String(methodIn || 'POST').toUpperCase();
  const epPath  = String(epPathIn || '').replace(/^\/+/, '');
  const baseUrl = (cfg.baseUrl || '').replace(/\/+$/, '');
  const fullUrl = /^https?:\/\//i.test(epPath) ? epPath : (epPath ? `${baseUrl}/${epPath}` : baseUrl);
  if (!fullUrl) throw new Error('baseUrl and endpoint are both empty');

  let epObj = null;
  if (endpointId) epObj = findRequestById(cfg.tree, endpointId);
  if (!epObj && epPath) epObj = findRequestByPath(cfg.tree, epPath);

  let payload       = String(payloadIn);
  let timestampUsed = null;
  if (updateTimestamp) {
    timestampUsed = String(Date.now());
    payload = payload.replace(/"timestamp"\s*:\s*"[^"]*"/, `"timestamp":"${timestampUsed}"`);
  }

  const headers = {
    ...(cfg.headers    || {}),
    ...(epObj?.headers || {}),
    ...extraHeaders,
    ...(correlationId ? { 'Correlation-ID': correlationId } : {}),
  };

  return {
    moduleId:       mod._id,
    moduleKind:     mod.kind,
    endpointId:     epObj?.id   || null,
    endpointName:   epObj?.name || null,
    method,
    fullUrl,
    headers,
    body:           payload,
    rawPayload:     payload,
    compactPayload: payload,
    timestampUsed,
    correlationId,
    cert:               cfg.https?.cert || undefined,
    key:                cfg.https?.key  || undefined,
    rejectUnauthorized: cfg.https?.rejectUnauthorized !== false,
    encrypt: false,
  };
}

module.exports = { prepareRequest, preparePtsRequest, prepareGenericRequest };
