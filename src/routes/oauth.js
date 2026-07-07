const router = require('express').Router();
const { oauthFetchToken, oauthRefreshToken, oauthTokenInfo, clearToken } = require('../services/oauth');
const { PTS_MODULE_ID } = require('../config');

function moduleId(req) {
  return (req.body?.moduleId) || req.query.m || req.query.moduleId || PTS_MODULE_ID;
}

router.get('/api/oauth/status', (req, res) => {
  res.json({ ok: true, token: oauthTokenInfo(moduleId(req)) });
});

router.post('/api/oauth/token', async (req, res) => {
  const id = moduleId(req);
  try {
    await oauthFetchToken(id);
    res.json({ ok: true, token: oauthTokenInfo(id) });
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

router.post('/api/oauth/refresh', async (req, res) => {
  const id = moduleId(req);
  try {
    await oauthRefreshToken(id);
    res.json({ ok: true, token: oauthTokenInfo(id) });
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

router.post('/api/oauth/clear', (req, res) => {
  const id = moduleId(req);
  clearToken(id);
  res.json({ ok: true, token: oauthTokenInfo(id) });
});

module.exports = router;
