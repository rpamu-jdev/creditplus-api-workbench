import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import OutputBlock from '../../components/OutputBlock';
import CardTypePills from '../../components/CardTypePills';
import JsonEditor from '../../components/JsonEditor';
import { useAppConfig } from '../../context/ConfigContext';
import { encryptPayload } from '../../api/encrypt';
import type { EncryptResult } from '../../types';

const MODULE_ID = 'pts';

export default function Encrypt() {
  const { config } = useAppConfig();
  const [activeCardType, setActiveCardType] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState('');
  const [payload, setPayload]     = useState('');
  const [algorithm, setAlgorithm] = useState('DES');
  const [keyLength, setKeyLength] = useState('168');
  const [mode, setMode]           = useState('STRING');
  const [oaepDigest, setOaepDigest] = useState('NONE');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<EncryptResult | null>(null);
  const [snack, setSnack]         = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  async function handleEncrypt() {
    if (!payload.trim()) { setSnack({ msg: 'Paste a JSON payload', sev: 'error' }); return; }
    if (!publicKey.trim() && !activeCardType) {
      setSnack({ msg: 'Pick a card type or paste a public key', sev: 'error' }); return;
    }
    setLoading(true);
    try {
      const r = await encryptPayload({
        payload: payload.trim(),
        publicKey: publicKey.trim() || undefined,
        cardType: publicKey.trim() ? undefined : (activeCardType ?? undefined),
        keyLength: Number(keyLength),
        mode,
        algorithm,
        oaepDigest,
        moduleId: MODULE_ID,
      });
      setResult(r);
      if (!r.ok) setSnack({ msg: r.error || 'Encryption failed', sev: 'error' });
      else setSnack({ msg: 'Encrypted', sev: 'success' });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function formatJson() {
    try { setPayload(JSON.stringify(JSON.parse(payload), null, 2)); }
    catch { setSnack({ msg: 'Invalid JSON', sev: 'error' }); }
  }

  const desKeyLength = algorithm === 'DES'
    ? [{ v: '168', l: '168-bit' }, { v: '112', l: '112-bit' }]
    : [{ v: '256', l: '256-bit' }, { v: '128', l: '128-bit' }];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Encrypt</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Encrypt a JSON payload using the card type's RSA public key.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Input</Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>Public Key Source</Typography>
              <CardTypePills config={config} activeCardType={activeCardType} onChange={setActiveCardType} />

              <TextField fullWidth multiline rows={3} label="RSA Public Key (Base64 DER) — overrides card type"
                value={publicKey} onChange={e => setPublicKey(e.target.value)} sx={{ mt: 2, mb: 2 }}
                placeholder="MIIBIjANBgkqhkiG9w0BAQEFA..." />

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField select fullWidth label="Algorithm" value={algorithm}
                    onChange={e => { setAlgorithm(e.target.value); setKeyLength(e.target.value === 'DES' ? '168' : '256'); }}>
                    <MenuItem value="DES">DES (3TDEA)</MenuItem>
                    <MenuItem value="AES">AES</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField select fullWidth label="Key Length" value={keyLength} onChange={e => setKeyLength(e.target.value)}>
                    {desKeyLength.map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={algorithm === 'AES' ? 6 : 12}>
                  <TextField select fullWidth label="Encoding Mode (DES)" value={mode} onChange={e => setMode(e.target.value)}>
                    <MenuItem value="STRING">STRING — Base64</MenuItem>
                    <MenuItem value="HEX">HEX</MenuItem>
                  </TextField>
                </Grid>
                {algorithm === 'AES' && (
                  <Grid item xs={6}>
                    <TextField select fullWidth label="OAEP Digest" value={oaepDigest} onChange={e => setOaepDigest(e.target.value)}>
                      <MenuItem value="NONE">NONE — PKCS#1 v1.5</MenuItem>
                      <MenuItem value="SHA256">SHA256 — OAEP</MenuItem>
                      <MenuItem value="SHA512">SHA512 — OAEP</MenuItem>
                    </TextField>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mb: 2 }}>
                <JsonEditor
                  value={payload}
                  onChange={setPayload}
                  label="Payload (JSON)"
                  placeholder='{"formFactorType":"CPI","timestamp":"..."}'
                  rows={8}
                  onFormat={formatJson}
                  onClear={() => { setPayload(''); setPublicKey(''); setResult(null); }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleEncrypt} disabled={loading}>
                  {loading ? 'Encrypting…' : 'Encrypt'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Output</Typography>
                {result && <Chip size="small" label={result.ok ? 'Encrypted' : 'Failed'} color={result.ok ? 'success' : 'error'} />}
              </Box>
              <OutputBlock label="Encrypted Body { data, encKey }" value={result?.body} defaultExpanded />
              <OutputBlock label="data — encrypted payload" value={result?.body?.data} />
              <OutputBlock label="encKey — RSA-wrapped DES key" value={result?.body?.encKey} />
              <OutputBlock label="Generated Key (hex)" value={result?.desKeyHex} />
              <OutputBlock label="Compact Payload" value={result?.compactPayload} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
