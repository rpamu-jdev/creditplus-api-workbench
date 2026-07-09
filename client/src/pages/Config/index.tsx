import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Collapse from '@mui/material/Collapse';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LinkIcon from '@mui/icons-material/Link';
import JsonEditor from '../../components/JsonEditor';
import { useAppConfig } from '../../context/ConfigContext';
import { saveConfig, resetConfig } from '../../api/config';
import type { AppConfig, CardType } from '../../types';

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

// ── Sample Dialog ────────────────────────────────────────────────────────────
interface SampleDialogProps {
  open: boolean;
  title: string;
  initialName: string;
  initialPayload: string;
  onSave: (name: string, payload: string) => void;
  onClose: () => void;
}

function SampleDialog({ open, title, initialName, initialPayload, onSave, onClose }: SampleDialogProps) {
  const [name, setName]       = useState(initialName);
  const [payload, setPayload] = useState(initialPayload);
  const [jsonErr, setJsonErr] = useState('');

  useEffect(() => {
    if (open) { setName(initialName); setPayload(initialPayload); setJsonErr(''); }
  }, [open, initialName, initialPayload]);

  function formatJson() {
    try { setPayload(JSON.stringify(JSON.parse(payload), null, 2)); setJsonErr(''); }
    catch (e) { setJsonErr((e as Error).message); }
  }

  function handlePayloadChange(v: string) {
    setPayload(v);
    try { JSON.parse(v); setJsonErr(''); } catch (e) { setJsonErr((e as Error).message); }
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim(), payload);
  }

  const isEdit = title.toLowerCase().startsWith('edit');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

      {/* Gradient dialog header */}
      <Box sx={{
        px: 3, py: 2.5,
        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 2, flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArticleOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem' }}>
            {isEdit ? 'Update the sample name and payload below' : 'Define a reusable payload template for this endpoint'}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 2.5, pt: 2.5 }}>
        {/* Sample name */}
        <TextField
          autoFocus fullWidth size="small" label="Sample Name" value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Default, Error case, Large payload…"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ArticleOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Payload editor */}
        <JsonEditor
          value={payload}
          onChange={handlePayloadChange}
          label="Payload (JSON)"
          placeholder='{"formFactorType":"CPI","timestamp":"1716000000000"}'
          rows={12}
          onFormat={formatJson}
        />

        {/* JSON error */}
        {jsonErr && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, px: 1, py: 0.6, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
            <Typography variant="caption" color="error.main" fontWeight={500}>{jsonErr}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim()}
          sx={{ borderRadius: 2, px: 3 }}>
          {isEdit ? 'Update Sample' : 'Add Sample'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Endpoint Dialog ───────────────────────────────────────────────────────────
interface EndpointDialogProps {
  open: boolean;
  title: string;
  initialPath: string;
  initialRequiresPinBlock: boolean;
  initialHeaders: string;
  onSave: (path: string, requiresPinBlock: boolean, headers: Record<string, string>) => void;
  onClose: () => void;
}

function EndpointDialog({ open, title, initialPath, initialRequiresPinBlock, initialHeaders, onSave, onClose }: EndpointDialogProps) {
  const [path, setPath]             = useState(initialPath);
  const [requiresPinBlock, setReq]  = useState(initialRequiresPinBlock);
  const [headers, setHeaders]       = useState(initialHeaders);
  const [headersErr, setHeadersErr] = useState('');

  useEffect(() => {
    if (open) { setPath(initialPath); setReq(initialRequiresPinBlock); setHeaders(initialHeaders); setHeadersErr(''); }
  }, [open, initialPath, initialRequiresPinBlock, initialHeaders]);

  function handleHeadersChange(v: string) {
    setHeaders(v);
    try { JSON.parse(v); setHeadersErr(''); } catch (e) { setHeadersErr((e as Error).message); }
  }

  function handleSave() {
    if (!path.trim()) return;
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(headers || '{}'); } catch { return; }
    onSave(path.trim(), requiresPinBlock, parsed);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

      {/* Gradient dialog header */}
      <Box sx={{
        px: 3, py: 2.5,
        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 2, flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LinkIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>{title}</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem' }}>
            Configure endpoint path, PIN block requirement and per-endpoint headers
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        <TextField
          autoFocus fullWidth size="small" label="Endpoint Path" value={path}
          onChange={e => setPath(e.target.value)} sx={{ mb: 2 }}
          placeholder="deviceapi/apis/v2/services/client/action"
          inputProps={{ style: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.85rem' } }}
        />
        <FormControlLabel
          control={<Switch checked={requiresPinBlock} onChange={e => setReq(e.target.checked)} />}
          label={<Box><Typography variant="body2" fontWeight={500}>Requires PIN block</Typography><Typography variant="caption" color="text.secondary">Shows the Clear PIN field on the Send Request page</Typography></Box>}
          sx={{ mb: 2 }}
        />
        <JsonEditor
          value={headers}
          onChange={handleHeadersChange}
          label="Custom Headers (JSON)"
          hint="leave empty to inherit card-type defaults"
          placeholder="{}"
          rows={4}
        />
        {headersErr && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, px: 1, py: 0.6, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
            <Typography variant="caption" color="error.main" fontWeight={500}>{headersErr}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!path.trim() || !!headersErr}
          sx={{ borderRadius: 2, px: 3 }}>Save Endpoint</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── CardTypePanel ─────────────────────────────────────────────────────────────
function CardTypePanel({ cardTypeKey, config, onChange }: {
  cardTypeKey: string;
  config: AppConfig;
  onChange: (ct: CardType) => void;
}) {
  const ct = config.cardTypes[cardTypeKey];
  const [expandedEp, setExpandedEp]   = useState<number | null>(null);
  const [epDialog, setEpDialog]       = useState<{ open: boolean; epIdx: number | null }>({ open: false, epIdx: null });
  const [sampleDialog, setSampleDialog] = useState<{ open: boolean; epIdx: number; sIdx: number | null }>({ open: false, epIdx: 0, sIdx: null });
  const [headersRaw, setHeadersRaw]   = useState(JSON.stringify(ct.headers ?? {}, null, 2));
  const [headersErr, setHeadersErr]   = useState('');

  useEffect(() => {
    setHeadersRaw(JSON.stringify(ct.headers ?? {}, null, 2));
  }, [cardTypeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch: Partial<CardType>) { onChange({ ...ct, ...patch }); }

  // Endpoint dialog helpers
  const editingEp = epDialog.epIdx !== null ? ct.endpoints[epDialog.epIdx] : null;

  function openAddEndpoint() {
    setEpDialog({ open: true, epIdx: null });
  }
  function openEditEndpoint(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    setEpDialog({ open: true, epIdx: i });
  }
  function saveEndpoint(path: string, requiresPinBlock: boolean, headers: Record<string, string>) {
    const eps = deepClone(ct.endpoints);
    if (epDialog.epIdx === null) {
      eps.push({ path, requiresPinBlock, headers, samples: [] });
      setExpandedEp(eps.length - 1);
    } else {
      eps[epDialog.epIdx] = { ...eps[epDialog.epIdx], path, requiresPinBlock, headers };
    }
    onChange({ ...ct, endpoints: eps });
    setEpDialog({ open: false, epIdx: null });
  }
  function removeEndpoint(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Remove this endpoint and all its samples?')) return;
    const eps = deepClone(ct.endpoints);
    eps.splice(i, 1);
    onChange({ ...ct, endpoints: eps });
    if (expandedEp === i) setExpandedEp(null);
  }

  // Sample dialog helpers
  const editingSample = sampleDialog.sIdx !== null
    ? ct.endpoints[sampleDialog.epIdx]?.samples[sampleDialog.sIdx]
    : null;

  function openAddSample(epIdx: number) {
    setSampleDialog({ open: true, epIdx, sIdx: null });
  }
  function openEditSample(epIdx: number, sIdx: number) {
    setSampleDialog({ open: true, epIdx, sIdx });
  }
  function saveSample(name: string, payload: string) {
    const eps = deepClone(ct.endpoints);
    if (sampleDialog.sIdx === null) {
      eps[sampleDialog.epIdx].samples.push({ name, payload });
    } else {
      eps[sampleDialog.epIdx].samples[sampleDialog.sIdx] = { name, payload };
    }
    onChange({ ...ct, endpoints: eps });
    setSampleDialog(s => ({ ...s, open: false }));
  }
  function removeSample(epIdx: number, sIdx: number) {
    if (!confirm('Remove this sample?')) return;
    const eps = deepClone(ct.endpoints);
    eps[epIdx].samples.splice(sIdx, 1);
    onChange({ ...ct, endpoints: eps });
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Identity</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Display Label" value={ct.label}
            onChange={e => update({ label: e.target.value })} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Base URL (normal requests)" value={ct.baseUrl}
            onChange={e => update({ baseUrl: e.target.value })} placeholder="http://10.137.160.59:37443" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="OAuth Base URL (when Enable OAuth is on)" value={ct.oauthBaseUrl ?? ''}
            onChange={e => update({ oauthBaseUrl: e.target.value })}
            placeholder="https://oauth-gateway/v1 — leave empty to use Base URL + /secure/" />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Encryption Keys</Typography>
      <TextField fullWidth multiline rows={3} size="small" label="RSA Public Key — DES / 3TDEA (Base64 DER)"
        value={ct.publicKey} onChange={e => update({ publicKey: e.target.value.replace(/\s+/g, '') })}
        sx={{ mb: 2 }} placeholder="MIIBIjANBgkqhkiG9w0BAQEFA..."
        inputProps={{ style: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.78rem', wordBreak: 'break-all' } }} />
      <TextField fullWidth multiline rows={3} size="small" label="RSA Public Key — AES (Base64 DER)"
        value={ct.aesPublicKey ?? ''} onChange={e => update({ aesPublicKey: e.target.value.replace(/\s+/g, '') })}
        sx={{ mb: 2 }} placeholder="MIIBIjANBgkqhkiG9w0BAQEFA..."
        helperText="Used when algorithm is AES. Leave empty to reuse the DES key."
        inputProps={{ style: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.78rem', wordBreak: 'break-all' } }} />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Default Headers</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        JSON headers applied to every endpoint of this card type
      </Typography>
      <JsonEditor
        value={headersRaw}
        onChange={v => {
          setHeadersRaw(v);
          try { update({ headers: JSON.parse(v) }); setHeadersErr(''); }
          catch (err) { setHeadersErr((err as Error).message); }
        }}
        label="Default Headers (JSON)"
        placeholder='{"Content-Type":"application/json"}'
        rows={3}
      />
      {headersErr && (
        <Box sx={{ display: 'flex', mt: 0.75, px: 1, py: 0.5, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
          <Typography variant="caption" color="error.main" fontWeight={500}>{headersErr}</Typography>
        </Box>
      )}
      <Box sx={{ mb: 2 }} />

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>Endpoints</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openAddEndpoint}>Add Endpoint</Button>
      </Box>

      {ct.endpoints.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
          No endpoints yet — click "Add Endpoint" to get started.
        </Typography>
      )}

      {ct.endpoints.map((ep, i) => {
        const isOpen = expandedEp === i;
        return (
          <Card key={i} variant="outlined" sx={{ mb: 1, overflow: 'visible' }}>
            {/* Endpoint header row */}
            <Box
              onClick={() => setExpandedEp(isOpen ? null : i)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 'inherit' }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontFamily='"Roboto Mono", monospace' fontSize="0.82rem"
                  noWrap title={ep.path}>{ep.path || '(no path)'}</Typography>
              </Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {ep.requiresPinBlock && <Chip size="small" label="PIN" color="warning" variant="outlined" />}
                <Chip size="small" label={`${ep.samples.length} sample${ep.samples.length !== 1 ? 's' : ''}`} variant="outlined" />
                <Tooltip title="Edit endpoint">
                  <IconButton size="small" onClick={e => openEditEndpoint(i, e)}><EditIcon fontSize="inherit" /></IconButton>
                </Tooltip>
                <Tooltip title="Remove endpoint">
                  <IconButton size="small" color="error" onClick={e => removeEndpoint(i, e)}><DeleteIcon fontSize="inherit" /></IconButton>
                </Tooltip>
                <IconButton size="small">{isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
              </Stack>
            </Box>

            {/* Samples section */}
            <Collapse in={isOpen}>
              <Divider />
              <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">SAMPLES</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => openAddSample(i)}>Add Sample</Button>
                </Box>

                {ep.samples.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    No samples — click "Add Sample" to add a payload template.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {ep.samples.map((s, si) => (
                      <ListItem
                        key={si}
                        disablePadding
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 0.5, px: 1.5, py: 0.5 }}
                      >
                        <ListItemText
                          primary={s.name}
                          secondary={s.payload.length > 80 ? s.payload.slice(0, 80) + '…' : s.payload}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption', fontFamily: '"Roboto Mono", monospace', fontSize: '0.7rem', noWrap: true }}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit sample">
                            <IconButton size="small" onClick={() => openEditSample(i, si)}><EditIcon fontSize="inherit" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Remove sample">
                            <IconButton size="small" color="error" onClick={() => removeSample(i, si)}><DeleteIcon fontSize="inherit" /></IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Collapse>
          </Card>
        );
      })}

      {/* Endpoint dialog */}
      <EndpointDialog
        open={epDialog.open}
        title={epDialog.epIdx === null ? 'Add Endpoint' : 'Edit Endpoint'}
        initialPath={editingEp?.path ?? ''}
        initialRequiresPinBlock={editingEp?.requiresPinBlock ?? false}
        initialHeaders={JSON.stringify(editingEp?.headers ?? {}, null, 2)}
        onSave={saveEndpoint}
        onClose={() => setEpDialog({ open: false, epIdx: null })}
      />

      {/* Sample dialog */}
      <SampleDialog
        open={sampleDialog.open}
        title={sampleDialog.sIdx === null ? 'Add Sample' : 'Edit Sample'}
        initialName={editingSample?.name ?? ''}
        initialPayload={editingSample?.payload ?? '{\n  \n}'}
        onSave={saveSample}
        onClose={() => setSampleDialog(s => ({ ...s, open: false }))}
      />
    </Box>
  );
}

// ── Config page ───────────────────────────────────────────────────────────────
export default function Config() {
  const { config: loaded, reload } = useAppConfig();
  const [config, setConfig]        = useState<AppConfig | null>(null);
  const [activeTab, setActiveTab]  = useState(0);
  const [addCardDialog, setAddCardDialog] = useState(false);
  const [newCardKey, setNewCardKey]       = useState('');
  const [saving, setSaving]        = useState(false);
  const [saved, setSaved]          = useState(false);
  const [snack, setSnack]          = useState<{ msg: string; sev: 'success' | 'error' | 'info' } | null>(null);

  const hasChanges = config && loaded
    ? JSON.stringify(config) !== JSON.stringify(loaded)
    : false;

  useEffect(() => { if (loaded) setConfig(deepClone(loaded)); }, [loaded]);

  if (!config) return <Typography>Loading…</Typography>;

  const cardKeys = Object.keys(config.cardTypes);

  function setCardType(key: string, ct: CardType) {
    setConfig(c => c ? { ...c, cardTypes: { ...c.cardTypes, [key]: ct } } : c);
  }

  function addCardType() {
    if (!config) return;
    const k = newCardKey.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!k || config.cardTypes[k]) { setSnack({ msg: k ? `"${k}" already exists` : 'Invalid key', sev: 'error' }); return; }
    const newCt: CardType = {
      label: newCardKey.charAt(0).toUpperCase() + newCardKey.slice(1),
      baseUrl: '', oauthBaseUrl: '', publicKey: '', aesPublicKey: '',
      headers: { 'Content-Type': 'application/json', 'Encryption-Algorithm': 'DES168' },
      endpoints: [],
    };
    setConfig(c => c ? { ...c, cardTypes: { ...c.cardTypes, [k]: newCt } } : c);
    setActiveTab(cardKeys.length);
    setAddCardDialog(false); setNewCardKey('');
  }

  function removeCardType(key: string) {
    if (!config) return;
    if (!confirm(`Remove card type "${key}"? This cannot be undone.`)) return;
    const clone = deepClone(config);
    delete (clone.cardTypes as Record<string, unknown>)[key];
    setConfig(clone);
    setActiveTab(0);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveConfig(config);
      setSaved(true);
      setSnack({ msg: 'Configuration saved successfully!', sev: 'success' });
      reload();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset all configuration to defaults? This cannot be undone.')) return;
    try {
      const def = await resetConfig();
      setConfig(def); setActiveTab(0);
      setSnack({ msg: 'Reset to defaults', sev: 'info' }); reload();
    } catch (e) { setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' }); }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Configuration</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Endpoints, samples, headers and encryption defaults — stored in MongoDB.
      </Typography>

      {/* Card Types */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Card Types</Typography>
          {(() => {
            const CARD_PALETTE: Record<string, { bg: string; border: string; dot: string; light: string }> = {
              credit:  { bg: '#fff1f2', border: '#f87171', dot: '#ef4444', light: '#fee2e2' },
              debit:   { bg: '#eff6ff', border: '#60a5fa', dot: '#3b82f6', light: '#dbeafe' },
              prepaid: { bg: '#f0fdf4', border: '#4ade80', dot: '#22c55e', light: '#dcfce7' },
              default: { bg: '#f8fafc', border: '#94a3b8', dot: '#64748b', light: '#f1f5f9' },
            };
            const pal = (k: string) => CARD_PALETTE[k.toLowerCase()] ?? CARD_PALETTE.default;
            const activeKey = cardKeys[Math.min(activeTab, cardKeys.length - 1)] ?? '';
            const ap = pal(activeKey);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
                  <Select
                    value={activeKey}
                    onChange={e => setActiveTab(cardKeys.indexOf(e.target.value as string))}
                    renderValue={val => {
                      const p = pal(val as string);
                      const label = config.cardTypes[val as string]?.label || val;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.dot, flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: p.dot }}>{label}</Typography>
                        </Box>
                      );
                    }}
                    sx={{
                      bgcolor: ap.bg,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: ap.border, borderWidth: '1.5px' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ap.dot },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ap.dot, borderWidth: '2px' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {cardKeys.map(k => {
                      const p = pal(k);
                      const label = config.cardTypes[k]?.label || k;
                      return (
                        <MenuItem key={k} value={k} sx={{
                          mx: 0.5, borderRadius: 1.5, mb: 0.25, py: 0.75,
                          '&:hover': { bgcolor: p.light },
                          '&.Mui-selected': { bgcolor: p.bg, '&:hover': { bgcolor: p.light } },
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.dot, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: p.dot, flex: 1 }}>{label}</Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                              {config.cardTypes[k]?.endpoints?.length ?? 0} ep
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <Button size="small" variant="outlined" startIcon={<AddIcon />}
                  onClick={() => setAddCardDialog(true)} sx={{ flexShrink: 0, borderRadius: 2 }}>
                  Add
                </Button>
                {activeKey && (
                  <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}
                    onClick={() => removeCardType(activeKey)} sx={{ flexShrink: 0, borderRadius: 2 }}>
                    Remove
                  </Button>
                )}
              </Box>
            );
          })()}
          {cardKeys[Math.min(activeTab, cardKeys.length - 1)] && (
            <CardTypePanel
              cardTypeKey={cardKeys[Math.min(activeTab, cardKeys.length - 1)]}
              config={config}
              onChange={ct => setCardType(cardKeys[Math.min(activeTab, cardKeys.length - 1)], ct)}
            />
          )}
        </CardContent>
      </Card>

      {/* Encryption Defaults */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Encryption Defaults</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Default Algorithm"
                value={config.encryption.algorithm ?? 'DES'}
                onChange={e => setConfig(c => c ? { ...c, encryption: { ...c.encryption, algorithm: e.target.value as 'DES' | 'AES' } } : c)}>
                <MenuItem value="DES">DES (3TDEA — Chapter 4)</MenuItem>
                <MenuItem value="AES">AES (Chapter 5)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Default Encoding Mode (DES)"
                value={config.encryption.mode ?? 'STRING'}
                onChange={e => setConfig(c => c ? { ...c, encryption: { ...c.encryption, mode: e.target.value as 'STRING' | 'HEX' } } : c)}>
                <MenuItem value="STRING">STRING — Base64</MenuItem>
                <MenuItem value="HEX">HEX</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>DES Defaults</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="DES Key Length"
                value={String(config.encryption.keyLength ?? 168)}
                onChange={e => setConfig(c => c ? { ...c, encryption: { ...c.encryption, keyLength: Number(e.target.value) } } : c)}>
                <MenuItem value="168">168-bit (24 bytes)</MenuItem>
                <MenuItem value="112">112-bit (16 bytes)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="DES Initialization Vector (hex)"
                value={config.encryption.ivHex ?? ''}
                onChange={e => setConfig(c => c ? { ...c, encryption: { ...c.encryption, ivHex: e.target.value } } : c)}
                placeholder="99999999999999999999999999999999"
                inputProps={{ style: { fontFamily: '"Roboto Mono", monospace' } }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>AES Defaults</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="AES Key Length"
                value={String(config.encryption.aesKeyLength ?? 256)}
                onChange={e => setConfig(c => c ? { ...c, encryption: { ...c.encryption, aesKeyLength: Number(e.target.value) } } : c)}>
                <MenuItem value="256">256-bit (32 bytes)</MenuItem>
                <MenuItem value="128">128-bit (16 bytes)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="OAEP Padding Digest"
                value={config.encryption.oaepDigest ?? 'NONE'}
                onChange={e => setConfig(c => c ? { ...c, encryption: { ...c.encryption, oaepDigest: e.target.value as 'NONE' | 'SHA256' | 'SHA512' } } : c)}>
                <MenuItem value="NONE">NONE — RSA PKCS#1 v1.5</MenuItem>
                <MenuItem value="SHA256">SHA256 — RSA-OAEP</MenuItem>
                <MenuItem value="SHA512">SHA512 — RSA-OAEP</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* OAuth 2.0 */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>OAuth 2.0</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bearer-token credentials. The OAuth Base URL per card type controls which host is used for API calls when OAuth is on.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Token URL"
                value={config.oauth.tokenUrl ?? ''}
                onChange={e => setConfig(c => c ? { ...c, oauth: { ...c.oauth, tokenUrl: e.target.value } } : c)}
                placeholder="https://gateway/v1/apis/tokens" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Refresh URL"
                value={config.oauth.refreshUrl ?? ''}
                onChange={e => setConfig(c => c ? { ...c, oauth: { ...c.oauth, refreshUrl: e.target.value } } : c)}
                placeholder="https://gateway/v1/apis/tokens/refresh" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Username"
                value={config.oauth.username ?? ''}
                onChange={e => setConfig(c => c ? { ...c, oauth: { ...c.oauth, username: e.target.value } } : c)}
                placeholder="customer_username" autoComplete="off" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="API Key" type="password"
                value={config.oauth.apiKey ?? ''}
                onChange={e => setConfig(c => c ? { ...c, oauth: { ...c.oauth, apiKey: e.target.value } } : c)}
                placeholder="customer_apiKey" autoComplete="off" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Box sx={{ position: 'relative' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? undefined :
              saved  ? <CheckIcon /> :
                       <SaveIcon />
            }
            sx={{
              minWidth: 140,
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              ...(saved && {
                bgcolor: 'success.main',
                '&:hover': { bgcolor: 'success.dark' },
              }),
            }}
          >
            {saving ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} thickness={4} color="inherit" />
                Saving…
              </Box>
            ) : saved ? 'Saved!' : 'Save Config'}
          </Button>
          {hasChanges && !saving && !saved && (
            <Box sx={{
              position: 'absolute',
              top: -4, right: -4,
              width: 10, height: 10,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              border: '2px solid',
              borderColor: 'background.paper',
              animation: 'pulse 1.8s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }} />
          )}
        </Box>
        {hasChanges && !saving && !saved && (
          <Fade in>
            <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ userSelect: 'none' }}>
              Unsaved changes
            </Typography>
          </Fade>
        )}
        <Button variant="outlined" onClick={() => { if (loaded) setConfig(deepClone(loaded)); }}>Reload</Button>
        <Button variant="outlined" color="error" onClick={handleReset} sx={{ ml: 'auto' }}>Reset to Defaults</Button>
      </Box>

      {/* Developer credit */}
      <Box sx={{ mt: 4, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.disabled" sx={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', display: 'block', mb: 1.5,
        }}>
          Developers
        </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>

        {/* rpamu card */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1.25,
          px: 1.5, py: 1, borderRadius: 2.5,
          border: '1px solid',
          borderColor: t => t.palette.mode === 'dark' ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.2)',
          bgcolor: t => t.palette.mode === 'dark' ? 'rgba(129,140,248,0.06)' : 'rgba(99,102,241,0.04)',
          position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
          },
        }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
          }}>
            <Typography fontWeight={800} sx={{ color: '#fff', fontSize: '0.62rem' }}>RP</Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} lineHeight={1.2} display="block">rpamu</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              SDE II &nbsp;·&nbsp; rpamu@extio.io
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'primary.main', fontWeight: 600, display: 'block' }}>
              EXTIO Technology &amp; Consulting LLP
            </Typography>
          </Box>
        </Box>

        {/* Claude card */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1.25,
          px: 1.5, py: 1, borderRadius: 2.5,
          border: '1px solid rgba(249,115,22,0.25)',
          bgcolor: t => t.palette.mode === 'dark' ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.04)',
          position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #f97316, #fb923c)',
          },
        }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
          }}>
            <Typography fontWeight={800} sx={{ color: '#fff', fontSize: '0.62rem' }}>AI</Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} lineHeight={1.2} display="block">Claude</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              AI Pair Programmer &nbsp;·&nbsp; claude.ai
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#f97316', fontWeight: 600, display: 'block' }}>
              Anthropic
            </Typography>
          </Box>
        </Box>

      </Box>
      </Box>

      {/* Add Card Type Dialog */}
      <Dialog open={addCardDialog} onClose={() => setAddCardDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Card Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Key (e.g. corporate)" value={newCardKey}
            onChange={e => setNewCardKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCardType()}
            sx={{ mt: 1 }}
            helperText="Used as identifier — lowercase letters, digits, hyphens, underscores."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCardDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addCardType}>Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snack?.sev} onClose={() => setSnack(null)} variant="filled" sx={{ minWidth: 240 }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
