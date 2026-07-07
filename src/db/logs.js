const { ObjectId } = require('mongodb');
const { assertMongoReady, getDb } = require('./mongo');
const { LOGS_COLLECTION } = require('../config');

async function ensureLogIndexes() {
  try {
    const coll = getDb().collection(LOGS_COLLECTION);
    await coll.createIndex({ timestamp: -1 });
    await coll.createIndex({ moduleId: 1, timestamp: -1 });
    await coll.createIndex({ moduleId: 1, endpointId: 1, timestamp: -1 });
    await coll.createIndex({ cardType: 1, timestamp: -1 });
    await coll.createIndex({ correlationId: 1 });
  } catch (e) {
    console.error('[mongo] failed to create log indexes:', e.message);
  }
}

async function logRequest(entry) {
  const db = getDb();
  if (!db) return; // fire-and-forget — never break the user request
  try {
    await db.collection(LOGS_COLLECTION).insertOne({ timestamp: new Date(), ...entry });
  } catch (e) {
    console.error('[logs] write failed:', e.message);
  }
}

async function queryLogs({ filter = {}, limit = 50 } = {}) {
  assertMongoReady();
  return getDb().collection(LOGS_COLLECTION)
    .find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
}

async function getLogById(id) {
  assertMongoReady();
  let _id;
  try { _id = new ObjectId(id); } catch { throw new Error('invalid id'); }
  const doc = await getDb().collection(LOGS_COLLECTION).findOne({ _id });
  if (!doc) throw new Error('not found');
  return doc;
}

async function deleteLogs(filter = {}) {
  assertMongoReady();
  const r = await getDb().collection(LOGS_COLLECTION).deleteMany(filter);
  return r.deletedCount;
}

module.exports = { ensureLogIndexes, logRequest, queryLogs, getLogById, deleteLogs };
