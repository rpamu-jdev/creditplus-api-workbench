import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { alpha } from '@mui/material/styles';
import OutputBlock from '../../components/OutputBlock';
import JsonEditor from '../../components/JsonEditor';
import { decryptPayload } from '../../api/decrypt';
import type { DecryptResult } from '../../types';

type Algorithm = 'DES' | 'AES';

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.67rem' }}>
        {children}
      </Typography>
      {hint && <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.67rem' }}>{hint}</Typography>}
    </Box>
  );
}

function CopyField({ label, hint, value, onChange, placeholder, multiline, rows }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <Box sx={{ position: 'relative' }}>
        <TextField fullWidth multiline={multiline} rows={rows} value={value}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          inputProps={{ style: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.82rem' } }}
        />
        {value && (
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={copy} sx={{ position: 'absolute', right: 6, top: 6, color: copied ? 'success.main' : 'text.disabled' }}>
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

export default function Decrypt() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('DES');
  const [ciphertext, setCiphertext] = useState('');
  const [desKeyHex, setDesKeyHex]   = useState('');
  const [mode, setMode]             = useState('HEX');
  const [aesKeyHex, setAesKeyHex]   = useState('');
  const [ivHex, setIvHex]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<DecryptResult | null>(null);
  const [snack, setSnack]           = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const isAES = algorithm === 'AES';

  function switchAlgorithm(algo: Algorithm) {
    setAlgorithm(algo);
    setResult(null);
  }

  async function handleDecrypt() {
    if (!ciphertext.trim()) {
      setSnack({ msg: 'Paste ciphertext or a JSON response', sev: 'error' }); return;
    }
    if (!isAES && !desKeyHex.trim()) {
      setSnack({ msg: 'Enter the DES key (hex)', sev: 'error' }); return;
    }
    if (isAES && !aesKeyHex.trim()) {
      setSnack({ msg: 'Enter the AES key (hex)', sev: 'error' }); return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await decryptPayload(
        isAES
          ? { ciphertext: ciphertext.trim(), algorithm: 'AES', aesKeyHex: aesKeyHex.trim(), ivHex: ivHex.trim() }
          : { ciphertext: ciphertext.trim(), algorithm: 'DES', desKeyHex: desKeyHex.trim(), mode }
      );
      setResult(r);
      if (!r.ok) setSnack({ msg: r.error || 'Decryption failed', sev: 'error' });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setCiphertext(''); setDesKeyHex(''); setAesKeyHex(''); setIvHex(''); setResult(null);
  }

  return (
    <Box>
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}>
            <LockOpenIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ lineHeight: 1.2 }}>Decrypt</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
              Pine Labs Credit+ Testing Tool · Response Decryption
            </Typography>
          </Box>
        </Box>

        {/* Algorithm dropdown */}
        <FormControl size="small" sx={{ ml: { xs: 0, sm: 'auto' }, minWidth: 160 }}>
          <InputLabel>Algorithm</InputLabel>
          <Select
            value={algorithm}
            label="Algorithm"
            onChange={e => switchAlgorithm(e.target.value as Algorithm)}
            sx={{
              fontWeight: 700, fontSize: '0.85rem',
              bgcolor: algorithm === 'AES' ? 'rgba(99,102,241,0.06)' : 'rgba(245,158,11,0.06)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: algorithm === 'AES' ? 'primary.main' : '#f59e0b',
                borderWidth: '1.5px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: algorithm === 'AES' ? 'primary.dark' : '#d97706',
              },
            }}
          >
            <MenuItem value="DES">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={600}>DES (3TDEA)</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="AES">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={600}>AES-CBC</Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>
        {isAES
          ? 'Decrypt a Pine Labs AES-CBC encrypted response using the session key and IV.'
          : 'Decrypt a Pine Labs 3DES encrypted response using the session key.'}
      </Typography>

      {/* ── Main layout ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>

        {/* ── Left: Input ── */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {/* Panel header */}
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
            display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Input</Typography>
            <Chip size="small" label={algorithm} variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.68rem', color: 'primary.main', borderColor: 'primary.light', height: 20 }} />
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Clear all">
              <IconButton size="small" onClick={handleClear} sx={{ color: 'text.disabled' }}>
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ p: 2 }}>
            {/* Ciphertext */}
            <Box sx={{ mb: 2 }}>
              <JsonEditor
                value={ciphertext}
                onChange={setCiphertext}
                label="Ciphertext"
                hint="raw ciphertext or JSON response envelope"
                placeholder={isAES
                  ? '{"data":"<hex>","iv":"<hex>"} or raw hex ciphertext'
                  : '{"data":"<base64>","encKey":"..."} or raw base64/hex'}
                rows={6}
                onClear={() => setCiphertext('')}
              />
            </Box>

            <Divider sx={{ my: 1.5 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isAES ? 'AES Key Material' : 'DES Key Material'}
              </Typography>
            </Divider>

            {isAES ? (
              <>
                <CopyField
                  label="AES Session Key" hint="hex — 16, 24, or 32 bytes"
                  value={aesKeyHex} onChange={setAesKeyHex}
                  placeholder="e.g. 2b7e151628aed2a6abf7158809cf4f3c…"
                />
                <CopyField
                  label="IV" hint="hex — 16 bytes · leave blank if embedded in JSON"
                  value={ivHex} onChange={setIvHex}
                  placeholder="e.g. 000102030405060708090a0b0c0d0e0f"
                />
              </>
            ) : (
              <>
                <CopyField
                  label="3DES Session Key" hint="hex — 16 or 24 bytes"
                  value={desKeyHex} onChange={setDesKeyHex}
                  placeholder="e.g. aabbccddeeff00112233445566778899…"
                />
                <Box sx={{ mb: 2 }}>
                  <FieldLabel>Encoding Mode</FieldLabel>
                  <TextField select fullWidth value={mode} onChange={e => setMode(e.target.value)}>
                    <MenuItem value="HEX">HEX</MenuItem>
                    <MenuItem value="STRING">STRING — Base64</MenuItem>
                  </TextField>
                </Box>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
              <Button onClick={handleDecrypt} disabled={loading}
                startIcon={loading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <LockOpenIcon />}
                sx={{ minWidth: 120 }}>
                {loading ? 'Decrypting…' : 'Decrypt'}
              </Button>
              <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                or Ctrl + Enter
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* ── Right: Output ── */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {/* Panel header */}
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
            display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Output</Typography>
            {result && (
              result.ok
                ? <Chip size="small" icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                    label={`Decrypted · ${algorithm}`} color="success"
                    sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                : <Chip size="small" icon={<ErrorOutlineIcon sx={{ fontSize: '14px !important' }} />}
                    label="Failed" color="error"
                    sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
            )}
            {result?.extractedFrom && (
              <Chip size="small" label={`from ${result.extractedFrom}`} variant="outlined"
                color="info" sx={{ fontSize: '0.68rem', height: 20 }} />
            )}
          </Box>

          <Box sx={{ p: 2 }}>
            {!result && !loading && (
              <Box sx={{
                py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                color: 'text.disabled',
              }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%',
                  bgcolor: t => alpha(t.palette.primary.main, 0.07),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LockOpenIcon sx={{ color: 'primary.light', fontSize: 22 }} />
                </Box>
                <Typography variant="body2" color="text.disabled" textAlign="center">
                  Fill in the form and click <strong>Decrypt</strong> to see the result
                </Typography>
              </Box>
            )}

            {loading && (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Decrypting…</Typography>
              </Box>
            )}

            {result && !loading && (
              <>
                <OutputBlock label="Plaintext (raw)"  value={result.decrypted} defaultExpanded />
                <OutputBlock label="Parsed JSON"      value={result.parsed}    defaultExpanded />
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
