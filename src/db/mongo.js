const { MongoClient } = require('mongodb');
const { MONGO_URL, MONGO_DB_NAME } = require('../config');

let mongoClient = null;
let mongoDb     = null;

const mongoStatus = {
  connected: false,
  error:     null,
  url:       MONGO_URL,
  db:        MONGO_DB_NAME,
};

function assertMongoReady() {
  if (!mongoDb || !mongoStatus.connected) {
    throw new Error(`MongoDB not connected: ${mongoStatus.error || 'no connection'}`);
  }
}

function getDb() {
  return mongoDb;
}

async function connect() {
  console.log(`[mongo] Connecting to ${MONGO_URL} (db=${MONGO_DB_NAME})`);
  mongoClient = new MongoClient(MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS:         5000,
  });
  await mongoClient.connect();
  mongoDb = mongoClient.db(MONGO_DB_NAME);
  await mongoDb.command({ ping: 1 });
  mongoStatus.connected = true;
  mongoStatus.error     = null;
  console.log('[mongo] Connected.');
}

async function disconnect() {
  try { if (mongoClient) await mongoClient.close(); } catch (_) {}
  mongoClient = null;
  mongoDb     = null;
  mongoStatus.connected = false;
}

// Graceful shutdown on SIGINT / SIGTERM
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    console.log(`\n[shutdown] Received ${sig}, closing MongoDB…`);
    await disconnect();
    process.exit(0);
  });
}

module.exports = { mongoStatus, assertMongoReady, getDb, connect, disconnect };
