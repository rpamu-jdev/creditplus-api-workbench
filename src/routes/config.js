const router = require('express').Router();
const { loadConfig, saveConfig, resetConfigToDefaults } = require('../db');

router.get('/api/config', async (_req, res) => {
  try {
    res.json(await loadConfig());
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

router.put('/api/config', async (req, res) => {
  try {
    const next = req.body;
    if (!next?.cardTypes) return res.status(400).json({ error: 'Invalid config: missing cardTypes' });
    await saveConfig(next);
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

router.post('/api/config/reset', async (_req, res) => {
  try {
    const def = await resetConfigToDefaults();
    res.json({ ok: true, config: def });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

module.exports = router;
