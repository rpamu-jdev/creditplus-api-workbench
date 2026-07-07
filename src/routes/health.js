const router = require('express').Router();
const { mongoStatus, reconnectMongo } = require('../db');

router.get('/api/health', (_req, res) => {
  res.json({
    ok:    true,
    mongo: { connected: mongoStatus.connected, url: mongoStatus.url, db: mongoStatus.db, error: mongoStatus.error },
  });
});

router.post('/api/mongo/reconnect', async (_req, res) => {
  await reconnectMongo();
  res.json({ ok: mongoStatus.connected, mongo: mongoStatus });
});

module.exports = router;
