const { nodeId } = require('./normalize');

/**
 * Convert a Postman v2 collection JSON into our generic-module tree format.
 * Returns { tree, stats }.
 */
function postmanToServices(collection) {
  let endpointCount = 0, folderCount = 0;

  function headersFromPostman(arr) {
    const out = {};
    for (const h of arr || []) {
      if (h?.disabled || !h?.key) continue;
      out[String(h.key)] = String(h.value || '');
    }
    return out;
  }

  function urlFromPostman(u) {
    if (!u) return '';
    if (typeof u === 'string') return u;
    if (u.raw) return u.raw;
    const host  = Array.isArray(u.host) ? u.host.join('.') : (u.host || '');
    const port  = u.port ? ':' + u.port : '';
    const pth   = Array.isArray(u.path) ? u.path.join('/') : (u.path || '');
    const proto = u.protocol ? u.protocol + '://' : '';
    return proto + host + port + (pth ? '/' + pth : '');
  }

  function bodyFromPostman(b) {
    if (!b) return { body: '', bodyType: 'none' };
    if (b.mode === 'raw') {
      const lang     = (b.options?.raw?.language || '').toLowerCase();
      const bodyType = ({ json: 'json', xml: 'xml', text: 'text', html: 'text', javascript: 'text' })[lang] || 'json';
      return { body: String(b.raw || ''), bodyType };
    }
    if (b.mode === 'urlencoded' && Array.isArray(b.urlencoded)) {
      return {
        body:     b.urlencoded.filter(p => !p.disabled).map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`).join('&'),
        bodyType: 'form',
      };
    }
    if (b.mode === 'formdata' && Array.isArray(b.formdata)) {
      return {
        body:     JSON.stringify(Object.fromEntries(b.formdata.filter(p => !p.disabled).map(p => [p.key, p.value || ''])), null, 2),
        bodyType: 'json',
      };
    }
    return { body: '', bodyType: 'none' };
  }

  function scriptFromPostman(events, listen) {
    if (!Array.isArray(events)) return '';
    const e = events.find(x => x?.listen === listen);
    if (!e) return '';
    const exec = e.script?.exec;
    return Array.isArray(exec) ? exec.join('\n') : (typeof exec === 'string' ? exec : '');
  }

  function convertItem(item) {
    if (Array.isArray(item?.item)) {
      folderCount++;
      return {
        id:       nodeId('folder'),
        type:     'folder',
        name:     String(item.name || 'Folder'),
        children: item.item.map(convertItem).filter(Boolean),
      };
    }
    if (item?.request) {
      endpointCount++;
      const r = item.request;
      const b = bodyFromPostman(r.body);
      return {
        id:         nodeId('req'),
        type:       'request',
        name:       String(item.name || ''),
        method:     String(r.method || 'GET').toUpperCase(),
        path:       urlFromPostman(r.url),
        headers:    headersFromPostman(r.header),
        body:       b.body,
        bodyType:   b.bodyType,
        preScript:  scriptFromPostman(item.event, 'prerequest'),
        postScript: scriptFromPostman(item.event, 'test'),
        samples:    [],
      };
    }
    return null;
  }

  const tree = (collection.item || []).map(convertItem).filter(Boolean);

  // Fold top-level orphan requests into a Default folder
  const orphanReqs = tree.filter(n => n.type === 'request');
  if (orphanReqs.length) {
    const folders = tree.filter(n => n.type === 'folder');
    folders.push({ id: nodeId('folder'), type: 'folder', name: 'Default', children: orphanReqs });
    tree.splice(0, tree.length, ...folders);
  }

  return { tree, stats: { folders: folderCount, endpoints: endpointCount, services: tree.length } };
}

module.exports = { postmanToServices };
