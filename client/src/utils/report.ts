import type { TraceRecord } from '../types';

function esc(v: unknown): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  return (s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

function section(title: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  return `
    <section>
      <h2>${esc(title)}</h2>
      <pre>${esc(value)}</pre>
    </section>`;
}

export function buildReportHtml(r: TraceRecord): string {
  const generatedAt = new Date().toLocaleString();
  const statusOk = (r.httpStatus ?? 0) < 300;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>APILeela Report — ${esc(r.correlationId)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #f8fafc; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  h1 { font-size: 20px; margin: 0; }
  .meta { color: #64748b; font-size: 12px; margin-top: 2px; }
  .badges span { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-right: 6px; }
  .ok { background: #dcfce7; color: #15803d; }
  .fail { background: #fee2e2; color: #b91c1c; }
  .neutral { background: #e0e7ff; color: #4338ca; }
  section { margin-bottom: 20px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 8px; }
  pre { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
  @media print { body { background: #fff; padding: 20px; } pre { break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>APILeela — Request Report</h1>
      <div class="meta">Generated ${esc(generatedAt)}</div>
    </div>
    <div class="badges">
      <span class="${statusOk ? 'ok' : 'fail'}">HTTP ${esc(r.httpStatus ?? '—')}</span>
      <span class="neutral">${esc(r.elapsedMs ?? '—')} ms</span>
      <span class="neutral">${r.encrypt ? 'Encrypted' : 'Plain-text'}</span>
      ${r.oauth ? '<span class="neutral">OAuth</span>' : ''}
    </div>
  </div>
  ${section('Request Summary', {
    url: r.url, correlationId: r.correlationId, encrypt: r.encrypt, oauth: r.oauth,
    algorithm: r.algorithm, keyLength: r.keyLength, mode: r.mode, timestampUsed: r.timestampUsed,
  })}
  ${section('Payload (sent, after timestamp update)', r.rawPayload)}
  ${section('Encrypted Request Body', r.encryptedBody)}
  ${section('Generated Key (hex)', r.desKeyHex ?? r.aesKeyHex)}
  ${section('Request Headers', r.requestHeaders)}
  ${section('Encrypted Response', r.encryptedResponse)}
  ${section('Decrypted Response', r.decryptedResponse)}
</body>
</html>`;
}

export function downloadReport(r: TraceRecord, format: 'html' | 'pdf') {
  const html = buildReportHtml(r);
  const filenameBase = `apileela-report-${r.correlationId || Date.now()}`;

  if (format === 'html') {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  // No PDF-generation library in this app — open the report in a new tab and
  // trigger the browser's print dialog, where the user picks "Save as PDF".
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 250);
}
