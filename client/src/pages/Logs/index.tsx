import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import ArticleIcon from '@mui/icons-material/Article';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OutputBlock from '../../components/OutputBlock';
import PageLoader from '../../components/PageLoader';
import { fetchLogs, deleteLogs } from '../../api/logs';
import type { LogEntry } from '../../types';

const CARD_COLORS: Record<string, string> = { credit: 'error', debit: 'primary', prepaid: 'success' };

function StatusChip({ code, phase }: { code?: number; phase?: string }) {
  if (phase === 'prepare-failed') return <Chip size="small" label="prep err" color="error" />;
  if (code == null) return <Chip size="small" label="no resp" color="error" />;
  const color = code >= 200 && code < 300 ? 'success' : code >= 400 ? 'error' : 'default';
  return <Chip size="small" label={String(code)} color={color as 'success' | 'error' | 'default'} />;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

// ── HTML report builder ───────────────────────────────────────────────────────

const REPORT_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",Inter,Arial,sans-serif;font-size:13px;color:#1e293b;background:#f8fafc;padding:32px}
h1{font-size:22px;font-weight:800;letter-spacing:-.4px;color:#4f46e5}
.subtitle{color:#64748b;margin-top:3px;font-size:12px}
.generated{color:#94a3b8;font-size:11px;margin-top:2px}
.summary{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0 28px}
.stat{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 20px;min-width:110px}
.stat-val{font-size:26px;font-weight:800;line-height:1}
.stat-lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
.entry{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:14px;overflow:hidden}
.entry-header{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:10px 14px;background:#f1f5f9;border-bottom:1px solid #e2e8f0}
.entry-num{font-size:10px;font-weight:700;color:#94a3b8;min-width:28px}
.ts{color:#64748b;font-size:11px}
.ms{color:#94a3b8;font-size:11px;margin-left:auto}
.badge{display:inline-block;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;letter-spacing:.04em}
.badge-ok{background:#dcfce7;color:#16a34a}
.badge-err{background:#fee2e2;color:#dc2626}
.badge-neu{background:#f1f5f9;color:#475569}
.badge-enc{background:#dbeafe;color:#1d4ed8}
.badge-ct{background:#ede9fe;color:#7c3aed}
.meta{border-collapse:collapse;margin:10px 14px 4px;width:calc(100% - 28px)}
.meta th{text-align:left;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px 4px 0;width:130px;vertical-align:top}
.meta td{color:#1e293b;font-size:12px;padding:4px 0;vertical-align:top;word-break:break-all}
.mono{font-family:"Roboto Mono","Courier New",monospace;font-size:11px}
.err-text{color:#dc2626}
.block-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;padding:10px 14px 4px}
.pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-family:"Roboto Mono","Courier New",monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;margin:0 14px 10px;color:#334155}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px}
@media print{body{background:#fff;padding:16px}.entry{page-break-inside:avoid;break-inside:avoid}}
`;

function fmtTs(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function htmlBadge(code?: number, phase?: string) {
  if (phase === 'prepare-failed') return `<span class="badge badge-err">prep-err</span>`;
  if (code == null) return `<span class="badge badge-err">no resp</span>`;
  if (code >= 200 && code < 300) return `<span class="badge badge-ok">${code}</span>`;
  if (code >= 400) return `<span class="badge badge-err">${code}</span>`;
  return `<span class="badge badge-neu">${code}</span>`;
}

function jsonBlock(v: unknown) {
  if (v == null) return '<em style="color:#9ca3af">—</em>';
  const s = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  return `<pre class="pre">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
}

function entryHtml(l: LogEntry, index: number) {
  return `
  <div class="entry">
    <div class="entry-header">
      <span class="entry-num">#${index + 1}</span>
      <span class="ts">${fmtTs(l.timestamp)}</span>
      ${l.cardType ? `<span class="badge badge-ct">${l.cardType}</span>` : ''}
      ${htmlBadge(l.httpStatus, l.phase)}
      <span class="badge ${l.encrypt ? 'badge-enc' : 'badge-neu'}">${l.encrypt ? 'ENC' : 'RAW'}</span>
      ${l.elapsedMs != null ? `<span class="ms">${l.elapsedMs} ms</span>` : ''}
    </div>
    <table class="meta">
      <tr><th>Endpoint</th><td>${l.endpoint ?? '—'}</td></tr>
      <tr><th>Full URL</th><td class="mono">${l.fullUrl ?? '—'}</td></tr>
      <tr><th>Phase</th><td>${l.phase ?? '—'}</td></tr>
      <tr><th>Correlation ID</th><td class="mono">${l.correlationId ?? '—'}</td></tr>
      <tr><th>Mode / Key Len</th><td>${l.mode ?? '—'} / ${l.keyLength ?? '—'}</td></tr>
      ${l.error ? `<tr><th>Error</th><td class="err-text">${l.error}</td></tr>` : ''}
    </table>
    ${(l.compactPayload || l.rawPayload) ? `<div class="block-label">Request Payload</div>${jsonBlock(l.compactPayload ?? l.rawPayload)}` : ''}
    ${l.encryptedRequestBody ? `<div class="block-label">Encrypted Request Body</div>${jsonBlock(l.encryptedRequestBody)}` : ''}
    ${l.desKeyHex ? `<div class="block-label">DES Key (hex)</div><pre class="pre mono">${l.desKeyHex}</pre>` : ''}
    ${l.requestHeaders ? `<div class="block-label">Request Headers</div>${jsonBlock(l.requestHeaders)}` : ''}
    ${l.responseHeaders ? `<div class="block-label">Response Headers</div>${jsonBlock(l.responseHeaders)}` : ''}
    ${l.decryptedResponse ? `<div class="block-label">Decrypted Response</div>${jsonBlock(l.decryptedResponse)}` : ''}
    ${l.encryptedResponse ? `<div class="block-label">Encrypted Response</div>${jsonBlock(l.encryptedResponse)}` : ''}
  </div>`;
}

function buildHtmlReport(logs: LogEntry[], title: string): string {
  const now      = new Date().toLocaleString();
  const total    = logs.length;
  const success  = logs.filter(l => l.httpStatus != null && l.httpStatus >= 200 && l.httpStatus < 300).length;
  const errors   = logs.filter(l => l.phase === 'prepare-failed' || (l.httpStatus != null && l.httpStatus >= 400) || !!l.error).length;
  const avgMs    = total ? Math.round(logs.reduce((s, l) => s + (l.elapsedMs ?? 0), 0) / total) : 0;
  const encCount = logs.filter(l => l.encrypt).length;

  const summarySection = total > 1 ? `
<div class="summary">
  <div class="stat"><div class="stat-val">${total}</div><div class="stat-lbl">Total</div></div>
  <div class="stat"><div class="stat-val" style="color:#16a34a">${success}</div><div class="stat-lbl">Success (2xx)</div></div>
  <div class="stat"><div class="stat-val" style="color:#dc2626">${errors}</div><div class="stat-lbl">Errors</div></div>
  <div class="stat"><div class="stat-val" style="color:#7c3aed">${avgMs}</div><div class="stat-lbl">Avg ms</div></div>
  <div class="stat"><div class="stat-val" style="color:#1d4ed8">${encCount}</div><div class="stat-lbl">Encrypted</div></div>
</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<h1>⚡ APILeela — ${title}</h1>
<div class="subtitle">Pine Labs Credit+ Testing Tool</div>
<div class="generated">Generated: ${now} &nbsp;·&nbsp; ${total} log${total !== 1 ? 's' : ''}</div>
${summarySection}
${logs.map((l, i) => entryHtml(l, i)).join('')}
<div class="footer">APILeela · rpamu@extio.io · SDE II · Pine Labs</div>
</body>
</html>`;
}

function triggerHtmlDownload(logs: LogEntry[], filename: string, title: string) {
  const html = buildHtmlReport(logs, title);
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function openPrintWindow(logs: LogEntry[], title: string) {
  const html = buildHtmlReport(logs, title);
  const win  = window.open('', '_blank');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.addEventListener('load', () => { win.focus(); win.print(); });
  return true;
}

function reportFilename(log: LogEntry | null, ext: string) {
  const d   = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts  = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const ep  = log ? (log.endpoint ?? '').split('/').pop() || 'log' : 'logs';
  return `apileela-${ep}-${ts}.${ext}`;
}

// ── LogRow ────────────────────────────────────────────────────────────────────

function LogRow({ log, onSnack }: { log: LogEntry; onSnack: (msg: string, sev: 'success' | 'info' | 'error') => void }) {
  const [rowDlMenu, setRowDlMenu] = useState<HTMLElement | null>(null);
  const cardColor = (CARD_COLORS[String(log.cardType ?? '').toLowerCase()] ?? 'default') as 'error' | 'primary' | 'success' | 'default';
  const title = `Request Report — ${log.endpoint ?? 'log'}`;

  function downloadRowHTML(e: React.MouseEvent) {
    e.stopPropagation();
    setRowDlMenu(null);
    triggerHtmlDownload([log], reportFilename(log, 'html'), title);
    onSnack('HTML report downloaded', 'success');
  }

  function downloadRowPDF(e: React.MouseEvent) {
    e.stopPropagation();
    setRowDlMenu(null);
    const ok = openPrintWindow([log], title);
    onSnack(ok ? 'Print dialog opened — choose "Save as PDF"' : 'Pop-up blocked — allow pop-ups and try again', ok ? 'info' : 'error');
  }

  return (
    <>
      <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 0.5, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ pr: 0.5, '& .MuiAccordionSummary-content': { gap: 1, flexWrap: 'wrap', alignItems: 'center', mr: 0 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>{formatTime(log.timestamp)}</Typography>
          {log.cardType && <Chip size="small" label={log.cardType} color={cardColor} variant="outlined" />}
          <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {log.endpoint || '(no endpoint)'}
          </Typography>
          {log.elapsedMs != null && <Typography variant="caption" color="text.secondary">{log.elapsedMs} ms</Typography>}
          <StatusChip code={log.httpStatus} phase={log.phase} />
          <Chip size="small" label={log.encrypt ? 'ENC' : 'RAW'} color={log.encrypt ? 'info' : 'default'} variant="outlined" />

          {/* Per-row download button */}
          <Tooltip title="Download this log">
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); setRowDlMenu(e.currentTarget); }}
              sx={{ ml: 0.5, flexShrink: 0 }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          <OutputBlock label="Identity" value={{ _id: log._id, timestamp: log.timestamp, cardType: log.cardType, phase: log.phase, fullUrl: log.fullUrl, correlationId: log.correlationId, encrypt: log.encrypt, keyLength: log.keyLength, mode: log.mode, httpStatus: log.httpStatus, elapsedMs: log.elapsedMs, error: log.error }} />
          <OutputBlock label="Request Headers" value={log.requestHeaders} />
          <OutputBlock label="Raw / Cleartext Payload" value={log.compactPayload ?? log.rawPayload} />
          <OutputBlock label="Encrypted Request Body" value={log.encryptedRequestBody} />
          <OutputBlock label="DES Key (hex)" value={log.desKeyHex} />
          <OutputBlock label="Response Headers" value={log.responseHeaders} />
          <OutputBlock label="Encrypted Response" value={log.encryptedResponse} />
          <OutputBlock label="Decrypted Response" value={log.decryptedResponse} />
        </AccordionDetails>
      </Accordion>

      {/* Per-row download menu */}
      <Menu
        anchorEl={rowDlMenu}
        open={Boolean(rowDlMenu)}
        onClose={() => setRowDlMenu(null)}
        onClick={e => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180, mt: 0.5 } }}
      >
        <MenuItem onClick={downloadRowHTML} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon sx={{ minWidth: 32 }}><ArticleIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary="HTML Report"
            secondary="Open in browser"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
        <MenuItem onClick={downloadRowPDF} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon sx={{ minWidth: 32 }}><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary="PDF Report"
            secondary="Print → Save as PDF"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}

// ── Logs page ─────────────────────────────────────────────────────────────────

export default function Logs() {
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const [loading, setLoading]       = useState(false);
  const [summary, setSummary]       = useState('');
  const [filterCardType, setFilterCardType] = useState('');
  const [filterPhase, setFilterPhase]       = useState('');
  const [filterLimit, setFilterLimit]       = useState('50');
  const [cardTypeOptions, setCardTypeOptions] = useState<string[]>([]);
  const [snack, setSnack]           = useState<{ msg: string; sev: 'success' | 'error' | 'info' } | null>(null);
  const [dlMenu, setDlMenu]         = useState<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchLogs({ limit: Number(filterLimit), cardType: filterCardType || undefined, phase: filterPhase || undefined });
      if (!r.ok) { setSummary('Error loading logs'); setSnack({ msg: r.error || 'Failed to load logs', sev: 'error' }); return; }
      setLogs(r.logs);
      const types = [...new Set(r.logs.map(l => l.cardType).filter(Boolean))] as string[];
      setCardTypeOptions(types.sort());
      const shown = r.logs.length;
      setSummary(`Showing ${shown} log${shown !== 1 ? 's' : ''}`
        + (filterCardType ? ` · ${filterCardType}` : '')
        + (filterPhase    ? ` · phase: ${filterPhase}` : ''));
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterCardType, filterPhase, filterLimit]);

  useEffect(() => { load(); }, [load]);

  async function handleClear() {
    if (!confirm('Delete ALL request logs from MongoDB? This cannot be undone.')) return;
    try {
      const r = await deleteLogs();
      if (r.ok) { setSnack({ msg: `Deleted ${r.deleted} logs`, sev: 'success' }); load(); }
    } catch (e) { setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' }); }
  }

  function downloadAllHTML() {
    setDlMenu(null);
    if (!logs.length) { setSnack({ msg: 'No logs to download', sev: 'info' }); return; }
    triggerHtmlDownload(logs, reportFilename(null, 'html'), `Request Log Report (${logs.length} logs)`);
    setSnack({ msg: `Downloaded ${logs.length} logs as HTML`, sev: 'success' });
  }

  function downloadAllPDF() {
    setDlMenu(null);
    if (!logs.length) { setSnack({ msg: 'No logs to download', sev: 'info' }); return; }
    const ok = openPrintWindow(logs, `Request Log Report (${logs.length} logs)`);
    setSnack({ msg: ok ? 'Print dialog opened — choose "Save as PDF"' : 'Pop-up blocked — allow pop-ups', sev: ok ? 'info' : 'error' });
  }

  const handleSnack = (msg: string, sev: 'success' | 'info' | 'error') => setSnack({ msg, sev });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Logs</Typography>
          <Typography variant="body2" color="text.secondary">Request history from MongoDB</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          disabled={!logs.length}
          onClick={e => setDlMenu(e.currentTarget)}
          sx={{ borderRadius: 2 }}
        >
          Download All
        </Button>
      </Box>

      {/* Bulk download menu */}
      <Menu
        anchorEl={dlMenu}
        open={Boolean(dlMenu)}
        onClose={() => setDlMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 190, mt: 0.5 } }}
      >
        <MenuItem onClick={downloadAllHTML} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon sx={{ minWidth: 32 }}><ArticleIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary="HTML Report"
            secondary={`All ${logs.length} logs`}
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
        <MenuItem onClick={downloadAllPDF} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon sx={{ minWidth: 32 }}><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary="PDF Report"
            secondary="Print → Save as PDF"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
      </Menu>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth size="small" label="Card Type" value={filterCardType} onChange={e => setFilterCardType(e.target.value)}>
                <MenuItem value="">All card types</MenuItem>
                {cardTypeOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth size="small" label="Phase" value={filterPhase} onChange={e => setFilterPhase(e.target.value)}>
                <MenuItem value="">All phases</MenuItem>
                <MenuItem value="success">success</MenuItem>
                <MenuItem value="http-error">http-error</MenuItem>
                <MenuItem value="prepare-failed">prepare-failed</MenuItem>
                <MenuItem value="send-failed">send-failed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField select fullWidth size="small" label="Limit" value={filterLimit} onChange={e => setFilterLimit(e.target.value)}>
                {['20','50','100','200'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item>
              <Button variant="contained" size="small" onClick={load} disabled={loading}>
                {loading ? <CircularProgress size={16} /> : 'Refresh'}
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" size="small" color="error" onClick={handleClear}>Clear All</Button>
            </Grid>
          </Grid>
          {summary && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{summary}</Typography>}
        </CardContent>
      </Card>

      <Divider sx={{ mb: 1 }} />

      {loading && !logs.length
        ? <PageLoader message="Fetching request logs…" />
        : logs.length === 0
          ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No logs yet — send a request from the main page.</Typography>
          : logs.map(log => <LogRow key={log._id} log={log} onSnack={handleSnack} />)
      }

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
