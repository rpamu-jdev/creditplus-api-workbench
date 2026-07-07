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

function LogRow({ log }: { log: LogEntry }) {
  const cardColor = (CARD_COLORS[String(log.cardType ?? '').toLowerCase()] ?? 'default') as 'error' | 'primary' | 'success' | 'default';
  return (
    <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 0.5, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { gap: 1, flexWrap: 'wrap', alignItems: 'center' } }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>{formatTime(log.timestamp)}</Typography>
        {log.cardType && <Chip size="small" label={log.cardType} color={cardColor} variant="outlined" />}
        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {log.endpoint || '(no endpoint)'}
        </Typography>
        {log.elapsedMs != null && <Typography variant="caption" color="text.secondary">{log.elapsedMs} ms</Typography>}
        <StatusChip code={log.httpStatus} phase={log.phase} />
        <Chip size="small" label={log.encrypt ? 'ENC' : 'RAW'} color={log.encrypt ? 'info' : 'default'} variant="outlined" />
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
  );
}

export default function Logs() {
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [summary, setSummary]     = useState('');
  const [filterCardType, setFilterCardType] = useState('');
  const [filterPhase, setFilterPhase]       = useState('');
  const [filterLimit, setFilterLimit]       = useState('50');
  const [cardTypeOptions, setCardTypeOptions] = useState<string[]>([]);
  const [snack, setSnack]         = useState<{ msg: string; sev: 'success' | 'error' | 'info' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchLogs({ limit: Number(filterLimit), cardType: filterCardType || undefined, phase: filterPhase || undefined });
      if (!r.ok) { setSummary('Error loading logs'); setSnack({ msg: r.error || 'Failed to load logs', sev: 'error' }); return; }
      setLogs(r.logs);
      const types = [...new Set(r.logs.map(l => l.cardType).filter(Boolean))] as string[];
      setCardTypeOptions(types.sort());
      setSummary(`Showing ${r.count} of last ${r.limit} logs`
        + (filterCardType ? ` · filtered to ${filterCardType}` : '')
        + (filterPhase    ? ` · phase = ${filterPhase}` : ''));
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

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Logs</Typography>

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
          : logs.map(log => <LogRow key={log._id} log={log} />)
      }

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
