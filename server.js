/*
 * APILeela — entry point
 * All logic lives under src/. This file only boots the server.
 */

require('dotenv').config();
const { initMongo } = require('./src/db');
const app           = require('./src/app');
const { PORT }      = require('./src/config');

(async () => {
  await initMongo(); // start listening even if mongo fails; ops return 503
  app.listen(PORT, () => {
    console.log(`APILeela listening on http://localhost:${PORT}`);
  });
})();
