const express = require('express');
const path    = require('path');

const healthRouter  = require('./routes/health');
const configRouter  = require('./routes/config');
const modulesRouter = require('./routes/modules');
const oauthRouter   = require('./routes/oauth');
const sendRouter    = require('./routes/send');
const cryptoRouter  = require('./routes/crypto');
const logsRouter    = require('./routes/logs');
const importRouter  = require('./routes/import');

const app = express();

app.use(express.json({ limit: '25mb' }));

app.use(healthRouter);
app.use(configRouter);
app.use(modulesRouter);
app.use(oauthRouter);
app.use(sendRouter);
app.use(cryptoRouter);
app.use(logsRouter);
app.use(importRouter);

const CLIENT_DIST = path.join(__dirname, '..', 'client-dist');
app.use(express.static(CLIENT_DIST));
app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));

module.exports = app;
