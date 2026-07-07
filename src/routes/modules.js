const router = require('express').Router();
const { listModules, loadModule, updateModule, createModule, deleteModule } = require('../db');

router.get('/api/modules', async (_req, res) => {
  try {
    const mods = await listModules();
    res.json({ ok: true, modules: mods });
  } catch (e) { res.status(503).json({ ok: false, error: e.message }); }
});

router.get('/api/modules/:id', async (req, res) => {
  try {
    const mod = await loadModule(req.params.id);
    res.json({ ok: true, module: mod });
  } catch (e) { res.status(404).json({ ok: false, error: e.message }); }
});

router.post('/api/modules', async (req, res) => {
  try {
    const mod = await createModule(req.body || {});
    res.json({ ok: true, module: mod });
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

router.put('/api/modules/:id', async (req, res) => {
  try {
    await updateModule(req.params.id, req.body || {});
    const mod = await loadModule(req.params.id);
    res.json({ ok: true, module: mod });
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

router.delete('/api/modules/:id', async (req, res) => {
  try {
    await deleteModule(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

module.exports = router;
