const fs   = require('fs');
const { assertMongoReady, getDb } = require('./mongo');
const { normalizeGenericConfig, nodeId } = require('../utils/normalize');
const {
  PTS_MODULE_ID, CONFIG_COLLECTION, CONFIG_DOC_ID,
  MODULES_COLLECTION, CONFIG_DEFAULT_PATH, LEGACY_CONFIG_PATH,
} = require('../config');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function genericDefaultConfig() {
  return {
    baseUrl:             '',
    headers:             { 'Content-Type': 'application/json' },
    https:               { cert: '', key: '', rejectUnauthorized: false },
    environments:        { default: { name: 'Default', variables: {} } },
    activeEnvironmentId: 'default',
    tree: [{ id: nodeId('folder'), type: 'folder', name: 'Default', children: [] }],
  };
}

// ─── Indexes + seed ───────────────────────────────────────────────────────────

async function ensureModuleIndexes() {
  try {
    const coll = getDb().collection(MODULES_COLLECTION);
    await coll.createIndex({ slug: 1 }, { unique: true });
    await coll.createIndex({ kind: 1 });
  } catch (e) {
    console.error('[mongo] failed to create module indexes:', e.message);
  }
}

async function seedIfNeeded() {
  const mods = getDb().collection(MODULES_COLLECTION);
  if (await mods.findOne({ _id: PTS_MODULE_ID })) return;

  // Prefer: legacy Mongo doc → legacy config.json → config.default.json
  const legacyDoc = await getDb().collection(CONFIG_COLLECTION).findOne({ _id: CONFIG_DOC_ID });
  let configBody, source;
  if (legacyDoc) {
    const { _id, updatedAt, ...cfg } = legacyDoc;
    configBody = cfg;
    source = 'legacy configurations.main';
  } else if (fs.existsSync(LEGACY_CONFIG_PATH)) {
    configBody = JSON.parse(fs.readFileSync(LEGACY_CONFIG_PATH, 'utf8'));
    source = 'legacy config.json file';
  } else {
    configBody = JSON.parse(fs.readFileSync(CONFIG_DEFAULT_PATH, 'utf8'));
    source = 'config.default.json';
  }

  await mods.insertOne({
    _id:         PTS_MODULE_ID,
    slug:        PTS_MODULE_ID,
    name:        'PTS Sanity Tester',
    kind:        'pts',
    description: 'Encrypted device APIs for Credit / Debit / Prepaid cards',
    config:      configBody,
    createdAt:   new Date(),
    updatedAt:   new Date(),
  });
  console.log(`[seed] Created modules.pts from ${source}`);
}

// ─── Module CRUD ──────────────────────────────────────────────────────────────

async function listModules() {
  assertMongoReady();
  return getDb().collection(MODULES_COLLECTION).find({}).sort({ kind: 1, name: 1 }).toArray();
}

async function loadModule(moduleId) {
  assertMongoReady();
  const doc = await getDb().collection(MODULES_COLLECTION).findOne({ _id: moduleId });
  if (!doc) throw new Error(`Unknown module: "${moduleId}"`);
  if (doc.kind === 'generic') doc.config = normalizeGenericConfig(doc.config);
  return doc;
}

async function updateModule(moduleId, patch) {
  assertMongoReady();
  const allowed = ['name', 'description', 'config'];
  const $set = { updatedAt: new Date() };
  for (const k of allowed) if (k in patch) $set[k] = patch[k];
  const mod = await loadModule(moduleId);
  if (mod.kind === 'generic' && $set.config) $set.config = normalizeGenericConfig($set.config);
  const r = await getDb().collection(MODULES_COLLECTION).updateOne({ _id: moduleId }, { $set });
  if (r.matchedCount === 0) throw new Error(`Unknown module: "${moduleId}"`);
}

async function createModule({ name, kind, slug, description, config }) {
  assertMongoReady();
  if (!name || !kind) throw new Error('name and kind are required');
  if (!['pts', 'generic'].includes(kind)) throw new Error('kind must be "pts" or "generic"');
  const finalSlug = slugify(slug || name);
  if (!finalSlug) throw new Error('slug could not be derived from name');
  if (await getDb().collection(MODULES_COLLECTION).findOne({ _id: finalSlug })) {
    throw new Error(`Module "${finalSlug}" already exists`);
  }
  const doc = {
    _id:         finalSlug,
    slug:        finalSlug,
    name:        String(name),
    kind,
    description: String(description || ''),
    config:      config || (kind === 'pts'
      ? JSON.parse(fs.readFileSync(CONFIG_DEFAULT_PATH, 'utf8'))
      : genericDefaultConfig()),
    createdAt:   new Date(),
    updatedAt:   new Date(),
  };
  await getDb().collection(MODULES_COLLECTION).insertOne(doc);
  return doc;
}

async function deleteModule(moduleId) {
  assertMongoReady();
  if (moduleId === PTS_MODULE_ID) throw new Error('The PTS module cannot be deleted');
  const r = await getDb().collection(MODULES_COLLECTION).deleteOne({ _id: moduleId });
  if (r.deletedCount === 0) throw new Error(`Unknown module: "${moduleId}"`);
}

// ─── PTS config shims ─────────────────────────────────────────────────────────

async function loadConfig() {
  const mod = await loadModule(PTS_MODULE_ID);
  return mod.config;
}

async function saveConfig(cfg) {
  await updateModule(PTS_MODULE_ID, { config: cfg });
}

async function resetConfigToDefaults() {
  assertMongoReady();
  const def = JSON.parse(fs.readFileSync(CONFIG_DEFAULT_PATH, 'utf8'));
  await updateModule(PTS_MODULE_ID, { config: def });
  return def;
}

module.exports = {
  ensureModuleIndexes,
  seedIfNeeded,
  listModules,
  loadModule,
  updateModule,
  createModule,
  deleteModule,
  loadConfig,
  saveConfig,
  resetConfigToDefaults,
  genericDefaultConfig,
};
