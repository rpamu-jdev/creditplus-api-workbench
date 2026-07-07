const { connect, disconnect, mongoStatus, assertMongoReady, getDb } = require('./mongo');
const { ensureModuleIndexes, seedIfNeeded, ...modulesApi } = require('./modules');
const { ensureLogIndexes, ...logsApi } = require('./logs');

// ─── Startup / reconnect ─────────────────────────────────────────────────────

async function initMongo() {
  try {
    await connect();
    await ensureModuleIndexes();
    await seedIfNeeded();
    await ensureLogIndexes();
  } catch (err) {
    mongoStatus.connected = false;
    mongoStatus.error     = err.message;
    console.error(`[mongo] Connection failed: ${err.message}`);
    console.error('[mongo] Server still running — POST /api/mongo/reconnect to retry.');
  }
}

async function reconnectMongo() {
  await disconnect();
  await initMongo();
}

module.exports = {
  // Lifecycle
  initMongo,
  reconnectMongo,
  // Connection state
  mongoStatus,
  assertMongoReady,
  getDb,
  // Modules
  ...modulesApi,
  // Logs
  ...logsApi,
};
