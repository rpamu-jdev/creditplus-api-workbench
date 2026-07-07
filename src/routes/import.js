const router = require('express').Router();
const { postmanToServices } = require('../utils/postman');
const { createModule }      = require('../db');

router.post('/api/import/postman', async (req, res) => {
  try {
    const collection = req.body;
    if (!collection?.info?.schema) {
      return res.status(400).json({ ok: false, error: 'Body must be a Postman v2 collection JSON (must have .info.schema)' });
    }
    const services = postmanToServices(collection);
    const mod      = await createModule({ kind: 'generic', label: collection.info?.name || 'Imported', services });
    res.json({ ok: true, module: mod });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

module.exports = router;
