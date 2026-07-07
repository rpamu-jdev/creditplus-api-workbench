import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIconMui from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TerminalIcon from '@mui/icons-material/Terminal';
import DownloadIcon from '@mui/icons-material/Download';
import CardTypePills from '../../components/CardTypePills';
import OutputBlock from '../../components/OutputBlock';
import ApiOverlay from '../../components/ApiOverlay';
import JsonEditor from '../../components/JsonEditor';
import { useAppConfig } from '../../context/ConfigContext';
import { sendRequest, prepareRequest } from '../../api/send';
import { fetchOAuthStatus, fetchOAuthToken, refreshOAuthToken } from '../../api/oauth';
import { downloadReport } from '../../utils/report';
import type { TraceRecord, OAuthTokenInfo, Endpoint } from '../../types';

const MODULE_ID = 'pts';

function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function tokenLabel(t: OAuthTokenInfo | null): string {
  if (!t || !t.present) return 'No token yet — fetched automatically on send';
  const head = (t.accessToken || '').slice(0, 18);
  const exp = t.expiresInSec != null ? `${t.expiresInSec}s left` : 'no expiry';
  return `${t.expired ? 'EXPIRED' : 'Valid'} · ${exp} · ${head}…`;
}

export default function SendRequest() {
  const { config } = useAppConfig();

  const [activeCardType, setActiveCardType] = useState<string | null>(null);
  const [endpoint, setEndpoint]   = useState('');
  const [payload, setPayload]     = useState('');
  const [encrypt, setEncrypt]     = useState(true);
  const [updateTs, setUpdateTs]   = useState(true);
  const [oauthOn, setOauthOn]     = useState(false);
  const [algorithm, setAlgorithm] = useState('DES');
  const [keyLength, setKeyLength] = useState('168');
  const [mode, setMode]           = useState('STRING');
  const [oaepDigest, setOaepDigest] = useState('NONE');
  const [correlationId, setCorrId] = useState(genUUID);
  const [extraHeaders, setExtraHeaders]       = useState('');
  const [extraBodyFields, setExtraBodyFields] = useState('');
  const [clearPin, setClearPin]   = useState('');
  const [showPin, setShowPin]     = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [loading, setLoading]     = useState(false);
  const [oauthToken, setOauthToken] = useState<OAuthTokenInfo | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [result, setResult]       = useState<TraceRecord | null>(null);
  const [snack, setSnack]         = useState<{ msg: string; sev: 'success' | 'error' | 'info' } | null>(null);
  const [curlCopied, setCurlCopied]         = useState(false);
  const [draftCurlCopied, setDraftCurlCopied] = useState(false);
  const [draftCurlLoading, setDraftCurlLoading] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState<HTMLElement | null>(null);

  async function copyDraftCurl() {
    if (!activeCardType || !endpoint) return;
    setDraftCurlLoading(true);
    try {
      const prep = await prepareRequest({
        cardType: activeCardType,
        endpoint,
        payload,
        encrypt,
        updateTimestamp: updateTs,
        extraHeaders: extraHeaders || undefined,
        extraBodyFields: extraBodyFields || undefined,
        oauth: oauthOn,
        clearPin: requiresPinBlock ? clearPin : undefined,
        correlationId,
        algorithm,
        keyLength: Number(keyLength),
        mode,
        oaepDigest,
        moduleId: MODULE_ID,
      });
      if (!prep.ok) {
        setSnack({ msg: prep.error || 'Failed to build request', sev: 'error' });
        return;
      }

      // Build the cURL string
      const hdrs = prep.headers ?? {};
      const headerLines = Object.entries(hdrs)
        .filter(([, v]) => v)
        .map(([k, v]) => `  -H '${k}: ${v}'`)
        .join(' \\\n');
      const body = prep.body ?? '';
      const curl = [
        `curl -X POST \\`,
        `  '${prep.fullUrl}' \\`,
        headerLines && `${headerLines} \\`,
        `  --data-raw '${body}'`,
      ].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(curl);

      // Populate the output panel with the prepared request metadata
      setResult({
        url:            prep.fullUrl ?? '',
        correlationId:  prep.correlationId ?? correlationId,
        encrypt:        !!prep.encrypt,
        oauth:          !!prep.oauth,
        algorithm:      prep.algorithm,
        keyLength:      prep.keyLength,
        mode:           prep.mode,
        timestampUsed:  prep.timestampUsed,
        rawPayload:     prep.rawPayload,
        encryptedBody:  prep.encryptedBody,
        requestHeaders: prep.headers,
        desKeyHex:      prep.desKeyHex,
        aesKeyHex:      prep.aesKeyHex,
        oauthToken:     prep.oauthToken,
      });

      setDraftCurlCopied(true);
      setTimeout(() => setDraftCurlCopied(false), 2000);
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setDraftCurlLoading(false);
    }
  }

  function buildCurl(r: TraceRecord): string {
    const hdrs = r.requestHeaders ?? {};
    const headerLines = Object.entries(hdrs)
      .map(([k, v]) => `  -H '${k}: ${v}'`)
      .join(' \\\n');
    const body = r.encryptedBody
      ? JSON.stringify(r.encryptedBody)
      : (r.rawPayload ?? '');
    return [
      `curl -X POST \\`,
      `  '${r.url}' \\`,
      headerLines && `${headerLines} \\`,
      `  -d '${body}'`,
    ].filter(Boolean).join('\n');
  }

  function copyCurl() {
    if (!result) return;
    navigator.clipboard.writeText(buildCurl(result)).then(() => {
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 2000);
    });
  }

  const cardType = config?.cardTypes[activeCardType ?? ''];
  const endpoints: Endpoint[] = cardType?.endpoints ?? [];
  const selectedEp = endpoints.find(e => e.path === endpoint);
  const samples = selectedEp?.samples ?? [];
  const requiresPinBlock = !!selectedEp?.requiresPinBlock;

  const baseUrl = (cardType?.baseUrl ?? '').replace(/\/+$/, '');
  const oauthBase = (cardType?.oauthBaseUrl ?? '').replace(/\/+$/, '');
  const cleanEp = endpoint.replace(/^\/+/, '');
  const previewBase = oauthOn && oauthBase ? oauthBase : baseUrl;
  const previewPath = oauthOn && !oauthBase ? `secure/${cleanEp}` : cleanEp;

  useEffect(() => {
    if (!config) return;
    const enc = config.encryption;
    if (enc) {
      setAlgorithm(enc.algorithm ?? 'DES');
      setKeyLength(String(enc.algorithm === 'AES' ? (enc.aesKeyLength ?? 256) : (enc.keyLength ?? 168)));
      setMode(enc.mode ?? 'STRING');
      setOaepDigest(enc.oaepDigest ?? 'NONE');
    }
    const types = Object.keys(config.cardTypes);
    if (types.length && !activeCardType) {
      setActiveCardType(types[0]);
    }
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const eps = config?.cardTypes[activeCardType ?? '']?.endpoints ?? [];
    if (eps.length) {
      setEndpoint(eps[0].path);
      const first = eps[0].samples[0];
      setPayload(first?.payload ?? '');
      setSelectedSample(first?.name ?? '');
    } else {
      setEndpoint(''); setPayload(''); setSelectedSample('');
    }
  }, [activeCardType, config]);

  // Reset selected sample when endpoint changes
  useEffect(() => {
    const first = samples[0];
    setSelectedSample(first?.name ?? '');
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSample = useCallback(() => {
    const s = samples.find(x => x.name === selectedSample) ?? samples[0];
    if (s) {
      setPayload(s.payload);
      setSnack({ msg: `Sample loaded: ${s.name}`, sev: 'success' });
    }
  }, [samples, selectedSample]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadOAuthStatus() {
    try {
      const t = await fetchOAuthStatus(MODULE_ID);
      setOauthToken(t);
    } catch { /* best-effort */ }
  }

  async function handleGetToken(refresh = false) {
    setOauthLoading(true);
    try {
      const t = refresh ? await refreshOAuthToken(MODULE_ID) : await fetchOAuthToken(MODULE_ID);
      setOauthToken(t);
      setSnack({ msg: refresh ? 'Token refreshed' : 'Token fetched', sev: 'success' });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setOauthLoading(false);
    }
  }

  useEffect(() => {
    if (oauthOn) loadOAuthStatus();
  }, [oauthOn]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!activeCardType) { setSnack({ msg: 'Select a card type', sev: 'error' }); return; }
    if (!endpoint)       { setSnack({ msg: 'Select an endpoint', sev: 'error' }); return; }
    setLoading(true);
    try {
      const r = await sendRequest({
        cardType: activeCardType,
        endpoint,
        payload,
        encrypt,
        updateTimestamp: updateTs,
        extraHeaders: extraHeaders || undefined,
        extraBodyFields: extraBodyFields || undefined,
        oauth: oauthOn,
        clearPin: requiresPinBlock ? clearPin : undefined,
        correlationId,
        algorithm,
        keyLength: Number(keyLength),
        mode,
        oaepDigest,
        moduleId: MODULE_ID,
      });
      if (!r.ok) {
        setSnack({ msg: r.error || 'Request failed', sev: 'error' });
      } else {
        setResult(r.trace ?? null);
        setSnack({ msg: `HTTP ${r.trace?.httpStatus ?? '?'} · ${r.trace?.elapsedMs ?? '?'} ms`, sev: 'success' });
        if (oauthOn && r.trace?.oauthToken) setOauthToken(r.trace.oauthToken);
      }
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setLoading(false);
      setCorrId(genUUID());
    }
  }

  const desKeyLengths = algorithm === 'DES'
    ? [{ v: '168', l: '168-bit' }, { v: '112', l: '112-bit' }]
    : [{ v: '256', l: '256-bit' }, { v: '128', l: '128-bit' }];

  return (
    <Box>
      {loading && <ApiOverlay />}

      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          <SendIconMui sx={{ color: '#fff', fontSize: 17 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1.2 }}>Send Request</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
            Pine Labs Credit+ Testing Tool
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3} mt={0.5}>
        Compose, encrypt, fire and inspect — full trace on every call.
      </Typography>

      <Grid container spacing={3}>
        {/* ── Left: Request ── */}
        <Grid item xs={12} lg={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Request</Typography>

              <CardTypePills config={config} activeCardType={activeCardType} onChange={setActiveCardType} showCustom={false} />

              <TextField select fullWidth label="Endpoint" value={endpoint}
                onChange={e => { setEndpoint(e.target.value); const ep = endpoints.find(x => x.path === e.target.value); if (ep?.samples[0]) setPayload(ep.samples[0].payload); }}
                sx={{ mt: 2 }}>
                {endpoints.map(ep => <MenuItem key={ep.path} value={ep.path}>{ep.path}</MenuItem>)}
              </TextField>

              {/* URL preview */}
              <Box sx={{ mt: 1, mb: 2, p: 1.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.78rem', display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box component="span" sx={{ color: 'error.main', fontWeight: 500 }}>{previewBase || '—'}</Box>
                <Box component="span" sx={{ color: 'text.disabled' }}>/</Box>
                <Box component="span" sx={{ color: 'primary.main' }}>{previewPath || '—'}</Box>
              </Box>

              {samples.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                  <TextField select size="small" label="Sample" value={selectedSample}
                    onChange={e => setSelectedSample(e.target.value)} sx={{ flex: 1 }}>
                    {samples.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                  </TextField>
                  <Button size="small" variant="outlined" onClick={loadSample} startIcon={<RefreshIcon />}>Load</Button>
                </Box>
              )}

              {requiresPinBlock && (
                <TextField fullWidth label="Clear PIN" value={clearPin}
                  onChange={e => setClearPin(e.target.value)} sx={{ mb: 2 }}
                  type={showPin ? 'text' : 'password'} inputProps={{ maxLength: 12 }}
                  helperText="Required for this endpoint. Stays local — never logged."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPin(v => !v)} edge="end">
                          {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }} />
              )}

              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">OPTIONS</Typography>
              </Divider>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel control={<Switch checked={encrypt} onChange={e => setEncrypt(e.target.checked)} />}
                    label={<Box><Typography variant="body2" fontWeight={500}>Encrypt payload</Typography><Typography variant="caption" color="text.secondary">{algorithm === 'AES' ? 'AES-CBC + RSA-OAEP' : '3DES + RSA-OAEP-SHA1'}</Typography></Box>} />
                  <FormControlLabel control={<Switch checked={updateTs} onChange={e => setUpdateTs(e.target.checked)} />}
                    label={<Box><Typography variant="body2" fontWeight={500}>Update timestamp</Typography><Typography variant="caption" color="text.secondary">Replace "timestamp" with epoch ms</Typography></Box>} />
                  <FormControlLabel control={<Switch checked={oauthOn} onChange={e => setOauthOn(e.target.checked)} />}
                    label={<Box><Typography variant="body2" fontWeight={500}>Enable OAuth</Typography><Typography variant="caption" color="text.secondary">Bearer token + OAuth base URL</Typography></Box>} />
                </Box>

                {oauthOn && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="OAuth Token" value={tokenLabel(oauthToken)} InputProps={{ readOnly: true }} />
                    <Button size="small" variant="outlined" onClick={() => handleGetToken(false)} disabled={oauthLoading}
                      sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Get token</Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => handleGetToken(true)} disabled={oauthLoading}
                      sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Refresh</Button>
                  </Box>
                )}
              </Stack>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField select fullWidth size="small" label="Algorithm" value={algorithm}
                    onChange={e => { setAlgorithm(e.target.value); setKeyLength(e.target.value === 'DES' ? '168' : '256'); }}>
                    <MenuItem value="DES">DES (3TDEA)</MenuItem>
                    <MenuItem value="AES">AES</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField select fullWidth size="small" label="Key Length" value={keyLength} onChange={e => setKeyLength(e.target.value)}>
                    {desKeyLengths.map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField select fullWidth size="small" label="Encoding Mode" value={mode} onChange={e => setMode(e.target.value)}>
                    <MenuItem value="STRING">STRING — Base64</MenuItem>
                    <MenuItem value="HEX">HEX</MenuItem>
                  </TextField>
                </Grid>
                {algorithm === 'AES' && (
                  <Grid item xs={6}>
                    <TextField select fullWidth size="small" label="OAEP Digest" value={oaepDigest} onChange={e => setOaepDigest(e.target.value)}>
                      <MenuItem value="NONE">NONE — PKCS#1 v1.5</MenuItem>
                      <MenuItem value="SHA256">SHA256 — OAEP</MenuItem>
                      <MenuItem value="SHA512">SHA512 — OAEP</MenuItem>
                    </TextField>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                  <TextField fullWidth size="small" label="Correlation-ID" value={correlationId} onChange={e => setCorrId(e.target.value)} />
                  <Tooltip title="Regenerate UUID"><IconButton size="small" onClick={() => setCorrId(genUUID())}><RefreshIcon /></IconButton></Tooltip>
                </Box>
              </Box>

              <Accordion variant="outlined" disableGutters sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={500}>Extra Headers <Typography component="span" variant="caption" color="text.secondary">(optional, per-request)</Typography></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <JsonEditor value={extraHeaders} onChange={setExtraHeaders} label="Headers (JSON)" hint="per-request" placeholder='{"X-Trace-Id":"abc"}' rows={3} />
                </AccordionDetails>
              </Accordion>

              <Accordion variant="outlined" disableGutters sx={{ mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={500}>Extra Body Fields <Typography component="span" variant="caption" color="text.secondary">(merged after encryption)</Typography></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <JsonEditor value={extraBodyFields} onChange={setExtraBodyFields} label="Body Fields (JSON)" hint="merged after encryption" placeholder='{"clientId":"abc-123"}' rows={3} />
                </AccordionDetails>
              </Accordion>

              <Divider sx={{ my: 2 }} />

              <JsonEditor
                value={payload}
                onChange={setPayload}
                label="Payload (JSON)"
                placeholder='{"formFactorType":"CPI","timestamp":"1716000000000"}'
                rows={10}
                onFormat={() => { try { setPayload(JSON.stringify(JSON.parse(payload), null, 2)); } catch { setSnack({ msg: 'Invalid JSON', sev: 'error' }); } }}
                onClear={() => setPayload('')}
              />

              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="contained" onClick={handleSend} disabled={loading}>
                  {loading ? 'Sending…' : 'Send Request'}
                </Button>
                <Tooltip title={
                  draftCurlLoading ? 'Encrypting payload…' :
                  draftCurlCopied  ? 'Copied!' :
                  encrypt ? 'Encrypt payload + build cURL (no request sent)' :
                  'Build cURL from current form (no request sent)'
                }>
                  <span>
                    <Button
                      variant="outlined"
                      color={draftCurlCopied ? 'success' : 'inherit'}
                      startIcon={
                        draftCurlLoading ? <CircularProgress size={14} color="inherit" /> :
                        draftCurlCopied  ? <ContentCopyIcon /> :
                        <TerminalIcon />
                      }
                      disabled={!activeCardType || !endpoint || draftCurlLoading}
                      onClick={copyDraftCurl}
                      sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      {draftCurlLoading ? 'Building…' : draftCurlCopied ? 'Copied!' : 'Copy cURL'}
                    </Button>
                  </span>
                </Tooltip>
                <Button variant="outlined" color="inherit" onClick={() => setResult(null)}>Clear Output</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Output ── */}
        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" fontWeight={600}>Output</Typography>
                {result && !loading && (
                  <>
                    <Chip size="small" label={`HTTP ${result.httpStatus ?? '—'}`} color={result.httpStatus && result.httpStatus < 300 ? 'success' : 'error'} />
                    <Chip size="small" label={`${result.elapsedMs ?? '—'} ms`} variant="outlined" />
                    <Chip size="small" label={result.encrypt ? 'Encrypted' : 'Plain-text'} color={result.encrypt ? 'info' : 'default'} variant="outlined" />
                    {result.oauth && <Chip size="small" label="OAuth" color="secondary" variant="outlined" />}
                  </>
                )}
                {result && !loading && (
                  <Tooltip title={curlCopied ? 'Copied!' : 'Copy as cURL'}>
                    <Button
                      size="small"
                      variant={curlCopied ? 'contained' : 'outlined'}
                      color={curlCopied ? 'success' : 'inherit'}
                      startIcon={curlCopied ? <ContentCopyIcon /> : <TerminalIcon />}
                      onClick={copyCurl}
                      sx={{ ml: result && !loading ? 0 : 'auto', borderRadius: 2, fontSize: '0.72rem', py: 0.3, px: 1.2, transition: 'all 0.2s' }}
                    >
                      {curlCopied ? 'Copied!' : 'Copy cURL'}
                    </Button>
                  </Tooltip>
                )}
                {result && !loading && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<DownloadIcon />}
                      onClick={e => setDownloadAnchor(e.currentTarget)}
                      sx={{ ml: 'auto', borderRadius: 2, fontSize: '0.72rem', py: 0.3, px: 1.2 }}
                    >
                      Download Report
                    </Button>
                    <Menu anchorEl={downloadAnchor} open={!!downloadAnchor} onClose={() => setDownloadAnchor(null)}>
                      <MenuItem onClick={() => { if (result) downloadReport(result, 'html'); setDownloadAnchor(null); }}>
                        Download as HTML
                      </MenuItem>
                      <MenuItem onClick={() => { if (result) downloadReport(result, 'pdf'); setDownloadAnchor(null); }}>
                        Download as PDF
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>

              <OutputBlock label="Request Summary" value={result ? { url: result.url, correlationId: result.correlationId, encrypt: result.encrypt, oauth: result.oauth, algorithm: result.algorithm, keyLength: result.keyLength, mode: result.mode, timestampUsed: result.timestampUsed } : null} defaultExpanded />
              <OutputBlock label="Payload (sent, after timestamp update)" value={result?.rawPayload} defaultExpanded />
              <OutputBlock label="Encrypted Request Body" value={result?.encryptedBody} />
              <OutputBlock label="Generated Key (hex)" value={result?.desKeyHex ?? result?.aesKeyHex} />
              <OutputBlock label="Request Headers" value={result?.requestHeaders} />
              <OutputBlock label="Encrypted Response" value={result?.encryptedResponse} defaultExpanded />
              <OutputBlock label="Decrypted Response" value={result?.decryptedResponse} defaultExpanded />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
