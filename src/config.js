const path = require('path');

module.exports = {
  PORT:                process.env.PORT     || 3000,
  MONGO_URL:           process.env.MONGO_URL || 'mongodb://192.168.1.99:37017/',
  MONGO_DB_NAME:       process.env.MONGO_DB  || 'apileela',

  // File paths (relative to repo root, one level above this src/ dir)
  CONFIG_DEFAULT_PATH: path.join(__dirname, '..', 'config.default.json'),
  LEGACY_CONFIG_PATH:  path.join(__dirname, '..', 'config.json'),

  // MongoDB collection / document identifiers
  CONFIG_COLLECTION:   'configurations',
  CONFIG_DOC_ID:       'main',
  MODULES_COLLECTION:  'modules',
  LOGS_COLLECTION:     'request_logs',
  PTS_MODULE_ID:       'pts',
};
