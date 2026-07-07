// ─── Node ID ──────────────────────────────────────────────────────────────────

function nodeId(kind) {
  return (kind || 'node') + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ─── Generic-module tree normalization ────────────────────────────────────────

function normalizeTreeNode(n) {
  if (!n || typeof n !== 'object') return null;
  const type = n.type === 'folder' ? 'folder' : 'request';
  if (type === 'folder') {
    return {
      id:       String(n.id || nodeId('folder')),
      type:     'folder',
      name:     String(n.name || 'Folder'),
      children: Array.isArray(n.children) ? n.children.map(normalizeTreeNode).filter(Boolean) : [],
    };
  }
  return {
    id:         String(n.id || nodeId('req')),
    type:       'request',
    name:       String(n.name || n.path || ''),
    method:     String(n.method || 'POST').toUpperCase(),
    path:       String(n.path || ''),
    body:       typeof n.body === 'string' ? n.body : '',
    bodyType:   ['none', 'json', 'xml', 'text', 'form'].includes(n.bodyType) ? n.bodyType : 'json',
    headers:    (n.headers && typeof n.headers === 'object') ? n.headers : {},
    preScript:  String(n.preScript  || ''),
    postScript: String(n.postScript || ''),
    samples:    Array.isArray(n.samples)
      ? n.samples.map((s, i) => ({ name: String(s?.name || `Sample ${i + 1}`), payload: String(s?.payload || '') }))
      : [],
  };
}

function normalizeGenericConfig(cfg) {
  cfg = cfg || {};

  // Environments
  if (!cfg.environments || typeof cfg.environments !== 'object') cfg.environments = {};
  for (const k of Object.keys(cfg.environments)) {
    const e = cfg.environments[k] || {};
    cfg.environments[k] = {
      name:      String(e.name || k),
      variables: (e.variables && typeof e.variables === 'object') ? e.variables : {},
    };
  }
  if (!Object.keys(cfg.environments).length) cfg.environments.default = { name: 'Default', variables: {} };
  if (!cfg.activeEnvironmentId || !cfg.environments[cfg.activeEnvironmentId]) {
    cfg.activeEnvironmentId = Object.keys(cfg.environments)[0];
  }

  // Tree migration: groups → services → tree
  if (cfg.groups && !cfg.services) { cfg.services = cfg.groups; delete cfg.groups; }
  if (Array.isArray(cfg.endpoints) && cfg.endpoints.length) {
    cfg.services = cfg.services || {};
    cfg.services.default = cfg.services.default || { label: 'Default', endpoints: [] };
    cfg.services.default.endpoints = [...(cfg.services.default.endpoints || []), ...cfg.endpoints];
    delete cfg.endpoints;
  }
  if (!Array.isArray(cfg.tree) && cfg.services && typeof cfg.services === 'object') {
    cfg.tree = Object.entries(cfg.services).map(([key, s]) => ({
      id:       'folder-' + key,
      type:     'folder',
      name:     s.label || key,
      children: (s.endpoints || []).map(e => normalizeTreeNode({ ...e, type: 'request' })),
    }));
    delete cfg.services;
  }
  if (!Array.isArray(cfg.tree)) cfg.tree = [];
  if (!cfg.tree.length) cfg.tree = [{ id: nodeId('folder'), type: 'folder', name: 'Default', children: [] }];
  cfg.tree = cfg.tree.map(normalizeTreeNode);
  return cfg;
}

// ─── Tree traversal ──────────────────────────────────────────────────────────

function walkTree(nodes, visit) {
  for (const n of nodes || []) {
    visit(n);
    if (n.type === 'folder') walkTree(n.children, visit);
  }
}

function findRequestById(tree, id) {
  let found = null;
  walkTree(tree, n => { if (!found && n.type === 'request' && n.id === id) found = n; });
  return found;
}

function findRequestByPath(tree, p) {
  let found = null;
  walkTree(tree, n => { if (!found && n.type === 'request' && (n.path === p || n.name === p)) found = n; });
  return found;
}

function flattenRequests(tree) {
  const out = [];
  walkTree(tree, n => { if (n.type === 'request') out.push(n); });
  return out;
}

// ─── PTS endpoint normalization ───────────────────────────────────────────────

function normalizeEndpoint(ep) {
  if (typeof ep === 'string') return { path: ep, samples: [], headers: {}, requiresPinBlock: false };
  if (ep && typeof ep === 'object') {
    let samples = Array.isArray(ep.samples)
      ? ep.samples.map((s, i) => ({ name: String(s?.name || `Sample ${i + 1}`), payload: String(s?.payload || '') }))
      : [];
    if (!samples.length && ep.samplePayload) samples = [{ name: 'Default', payload: String(ep.samplePayload) }];
    return {
      path:             String(ep.path || ''),
      samples,
      headers:          (ep.headers && typeof ep.headers === 'object') ? ep.headers : {},
      requiresPinBlock: !!ep.requiresPinBlock,
    };
  }
  return { path: '', samples: [], headers: {}, requiresPinBlock: false };
}

function findEndpoint(ct, endpointPath) {
  for (const raw of (ct?.endpoints || [])) {
    const ep = normalizeEndpoint(raw);
    if (ep.path === endpointPath) return ep;
  }
  return null;
}

function normalizeGenericEndpoint(ep) {
  if (typeof ep === 'string') return { name: ep, path: ep, method: 'POST', body: '', samples: [], headers: {} };
  if (ep && typeof ep === 'object') {
    const samples = Array.isArray(ep.samples)
      ? ep.samples.map((s, i) => ({ name: String(s?.name || `Sample ${i + 1}`), payload: String(s?.payload || '') }))
      : [];
    return {
      name:    String(ep.name || ep.path || ''),
      path:    String(ep.path || ''),
      method:  String(ep.method || 'POST').toUpperCase(),
      body:    typeof ep.body === 'string' ? ep.body : '',
      samples,
      headers: (ep.headers && typeof ep.headers === 'object') ? ep.headers : {},
    };
  }
  return { name: '', path: '', method: 'POST', body: '', samples: [], headers: {} };
}

module.exports = {
  nodeId,
  normalizeTreeNode,
  normalizeGenericConfig,
  walkTree,
  findRequestById,
  findRequestByPath,
  flattenRequests,
  normalizeEndpoint,
  findEndpoint,
  normalizeGenericEndpoint,
};
