const router = require('express').Router();
const { queryLogs, getLogById, deleteLogs } = require('../db');

router.get('/api/logs', async (req, res) => {
  try {
    const { limit, skip, moduleId, cardType, endpoint, httpStatus, phase, from, to, q } = req.query;
    const filter = {};
    if (moduleId)   filter.moduleId   = moduleId;
    if (cardType)   filter.cardType   = cardType;
    if (endpoint)   filter.endpoint   = endpoint;
    if (httpStatus) filter.httpStatus = Number(httpStatus);
    if (phase)      filter.phase      = phase;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (q) filter.$text = { $search: q };
    const logs = await queryLogs(filter, { limit: Number(limit) || 50, skip: Number(skip) || 0 });
    res.json({ ok: true, logs });
  } catch (e) { res.status(503).json({ ok: false, error: e.message }); }
});

router.get('/api/logs/:id', async (req, res) => {
  try {
    const log = await getLogById(req.params.id);
    if (!log) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, log });
  } catch (e) { res.status(503).json({ ok: false, error: e.message }); }
});

router.delete('/api/logs', async (req, res) => {
  try {
    const { before, moduleId } = req.query;
    const filter = {};
    if (before)   filter.createdAt = { $lt: new Date(before) };
    if (moduleId) filter.moduleId  = moduleId;
    const deleted = await deleteLogs(filter);
    res.json({ ok: true, deleted });
  } catch (e) { res.status(503).json({ ok: false, error: e.message }); }
});

module.exports = router;
