const router = require('express').Router();
const { prepareRequest }          = require('../services/prepare');
const { httpRequest }             = require('../services/http');
const { oauthEnsureToken, maskAuthHeaders } = require('../services/oauth');
const { decryptResponse }         = require('../crypto/des');
const { decryptAESResponse }      = require('../crypto/aes');
const { logRequest }              = require('../db');
const { PTS_MODULE_ID }           = require('../config');

// ─── POST /api/prepare ────────────────────────────────────────────────────────
// Runs the full preparation pipeline (encrypt, OAuth token) but does NOT send
// the outbound HTTP request. Used by the client "Copy cURL" button.

router.post('/api/prepare', async (req, res) => {
  try {
    const prep = await prepareRequest(req.body);
    res.json({ ok: true, ...prep });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ─── POST /api/send ───────────────────────────────────────────────────────────

router.post('/api/send', async (req, res) => {
  const moduleId = req.body?.moduleId || PTS_MODULE_ID;
  const cardType = req.body?.cardType;
  const endpoint = req.body?.endpoint;

  let prep;
  try {
    prep = await prepareRequest(req.body);
  } catch (e) {
    logRequest({ phase: 'prepare-failed', moduleId, cardType, endpoint, error: e.message, requestInput: req.body });
    return res.status(400).json({ ok: false, error: e.message });
  }

  const trace = {
    url:                  prep.fullUrl,
    correlationId:        prep.correlationId,
    encrypt:              prep.encrypt,
    oauth:                prep.oauth,
    algorithm:            prep.algorithm,
    keyLength:            prep.keyLength,
    mode:                 prep.mode,
    oaepDigest:           prep.oaepDigest,
    timestampUsed:        prep.timestampUsed,
    rawPayload:           prep.rawPayload,
    compactPayload:       prep.compactPayload,
    desKeyHex:            prep.desKeyHex,
    aesKeyHex:            prep.aesKeyHex,
    aesIvHex:             prep.aesIvHex,
    publicKeyFingerprint: prep.publicKeyFingerprint,
    encryptedBody:        prep.encryptedBody,
    encryptedRequestBody: prep.encryptedBody, // kept for log back-compat
    requestHeaders:       prep.headers,
  };

  let sendOk = false;
  try {
    let started = Date.now();
    let resp    = await httpRequest({
      fullUrl:            prep.fullUrl,
      body:               prep.body,
      headers:            prep.headers,
      method:             prep.method || 'POST',
      cert:               prep.cert,
      key:                prep.key,
      rejectUnauthorized: prep.rejectUnauthorized,
    });
    let elapsed = Date.now() - started;

    // On 401 with OAuth, refresh the token once and retry the same encrypted body
    if (prep.oauth && resp.status === 401) {
      try {
        const tok         = await oauthEnsureToken(moduleId, { forceRefresh: true });
        const retryHeaders = { ...prep.headers, Authorization: `${tok.tokenType || 'Bearer'} ${tok.accessToken}` };
        started = Date.now();
        resp    = await httpRequest({
          fullUrl: prep.fullUrl, body: prep.body, headers: retryHeaders,
          method:  prep.method || 'POST', cert: prep.cert, key: prep.key,
          rejectUnauthorized: prep.rejectUnauthorized,
        });
        elapsed               = Date.now() - started;
        prep.headers          = retryHeaders;
        trace.requestHeaders  = retryHeaders;
        trace.oauthRetried    = true;
      } catch (e) {
        trace.oauthRefreshError = e.message;
      }
    }

    trace.elapsedMs         = elapsed;
    trace.httpStatus        = resp.status;
    trace.responseHeaders   = resp.headers;
    trace.encryptedResponse = resp.json ?? resp.text;

    if (prep.encrypt && resp.json) {
      let decrypted = null;
      if (prep.algorithm === 'AES' && prep.aesKeyHex) {
        decrypted = decryptAESResponse(resp.json, prep.aesKeyHex, prep.aesIvHex);
      } else if (prep.desKeyHex) {
        decrypted = decryptResponse(resp.json, prep.desKeyHex, prep.mode);
      }
      if (decrypted) {
        try { trace.decryptedResponse = JSON.parse(decrypted); }
        catch { trace.decryptedResponse = decrypted; }
      }
    }
    sendOk = true;
  } catch (e) {
    trace.error = e.message;
  }

  logRequest({
    phase:                sendOk ? 'sent' : 'send-failed',
    moduleId,
    moduleKind:           prep.moduleKind,
    endpointId:           prep.endpointId,
    endpointName:         prep.endpointName,
    method:               prep.method,
    cardType,
    endpoint,
    fullUrl:              trace.url,
    correlationId:        trace.correlationId,
    encrypt:              trace.encrypt,
    algorithm:            trace.algorithm,
    keyLength:            trace.keyLength,
    mode:                 trace.mode,
    oaepDigest:           trace.oaepDigest,
    timestampUsed:        trace.timestampUsed,
    desKeyHex:            trace.desKeyHex,
    aesKeyHex:            trace.aesKeyHex,
    aesIvHex:             trace.aesIvHex,
    publicKeyFingerprint: trace.publicKeyFingerprint,
    requestHeaders:       maskAuthHeaders(trace.requestHeaders),
    oauth:                trace.oauth,
    oauthRetried:         trace.oauthRetried || false,
    rawPayload:           trace.rawPayload,
    compactPayload:       trace.compactPayload,
    encryptedRequestBody: trace.encryptedRequestBody,
    httpStatus:           trace.httpStatus,
    elapsedMs:            trace.elapsedMs,
    responseHeaders:      trace.responseHeaders,
    encryptedResponse:    trace.encryptedResponse,
    decryptedResponse:    trace.decryptedResponse,
    error:                trace.error || null,
  });

  if (sendOk) res.json({ ok: true, trace });
  else        res.status(500).json({ ok: false, error: trace.error, trace });
});

module.exports = router;
