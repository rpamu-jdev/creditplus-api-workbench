const http  = require('http');
const https = require('https');
const { URL } = require('url');

function httpRequest({ fullUrl, body = '', headers = {}, method = 'POST', timeoutMs = 30000, cert, key, rejectUnauthorized = false }) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(fullUrl); }
    catch (e) { return reject(new Error(`Invalid URL: ${fullUrl}`)); }

    const isHttps     = parsed.protocol === 'https:';
    const lib         = isHttps ? https : http;
    const methodUpper = String(method || 'POST').toUpperCase();
    const hasBody     = !['GET', 'HEAD', 'OPTIONS'].includes(methodUpper) && body && body.length > 0;

    const opts = {
      method:             methodUpper,
      hostname:           parsed.hostname,
      port:               parsed.port || (isHttps ? 443 : 80),
      path:               parsed.pathname + parsed.search,
      headers:            { ...headers, ...(hasBody ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
      rejectUnauthorized: !!rejectUnauthorized,
    };
    if (isHttps && cert) opts.cert = cert;
    if (isHttps && key)  opts.key  = key;

    const req = lib.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Request timed out after ${timeoutMs}ms`)));
    if (hasBody) req.write(body);
    req.end();
  });
}

module.exports = { httpRequest };
