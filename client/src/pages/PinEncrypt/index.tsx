import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import OutputBlock from '../../components/OutputBlock';
import CardTypePills from '../../components/CardTypePills';
import { useAppConfig } from '../../context/ConfigContext';
import { encryptPin } from '../../api/pin';
import type { PinEncryptResult } from '../../types';

const MODULE_ID = 'pts';

export default function PinEncrypt() {
  const { config } = useAppConfig();
  const [activeCardType, setActiveCardType] = useState<string | null>(null);
  const [deviceNumber, setDeviceNumber] = useState('');
  const [clearPin, setClearPin]         = useState('');
  const [showPin, setShowPin]           = useState(false);
  const [publicKey, setPublicKey]       = useState('');
  const [keyLength, setKeyLength]       = useState('112');
  const [mode, setMode]                 = useState('HEX');
  const [ivHex, setIvHex]              = useState('');
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<PinEncryptResult | null>(null);
  const [snack, setSnack]               = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  async function handleGenerate() {
    if (!deviceNumber.trim()) { setSnack({ msg: 'Enter a device number', sev: 'error' }); return; }
    if (!clearPin.trim())     { setSnack({ msg: 'Enter the clear PIN', sev: 'error' }); return; }
    if (!publicKey.trim() && !activeCardType) {
      setSnack({ msg: 'Pick a card type or paste a public key', sev: 'error' }); return;
    }
    setLoading(true);
    try {
      const r = await encryptPin({
        deviceNumber: deviceNumber.trim(),
        clearPin: clearPin.trim(),
        publicKey: publicKey.trim() || undefined,
        cardType: publicKey.trim() ? undefined : (activeCardType ?? undefined),
        keyLength: Number(keyLength),
        mode,
        ivHex: ivHex.trim() || undefined,
        moduleId: MODULE_ID,
      });
      setResult(r);
      if (!r.ok) setSnack({ msg: r.error || 'PIN encryption failed', sev: 'error' });
      else setSnack({ msg: 'Encrypted PIN generated', sev: 'success' });
    } catch (e) {
      setSnack({ msg: e instanceof Error ? e.message : String(e), sev: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>PIN Encrypt</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Build an ISO-0 (Format 0) PIN block from a device number + clear PIN and encrypt it (3DES + RSA-OAEP-SHA1).
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Input</Typography>

              <TextField fullWidth label="Device Number (card / PAN)" value={deviceNumber}
                onChange={e => setDeviceNumber(e.target.value)} sx={{ mb: 2 }}
                placeholder="5432101234567891"
                helperText="The PAN block uses the 12 right-most digits, excluding the last check digit." />

              <TextField fullWidth label="Clear PIN" value={clearPin}
                onChange={e => setClearPin(e.target.value)} sx={{ mb: 2 }}
                type={showPin ? 'text' : 'password'} inputProps={{ maxLength: 6 }}
                placeholder="4 or 6 digits"
                helperText="Stays local to your browser → this Node process — never logged."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPin(v => !v)} edge="end">
                        {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>Public Key Source</Typography>
              <CardTypePills config={config} activeCardType={activeCardType} onChange={setActiveCardType} />

              <TextField fullWidth multiline rows={3} label="RSA Public Key (Base64 DER) — overrides card type"
                value={publicKey} onChange={e => setPublicKey(e.target.value)} sx={{ mt: 2, mb: 2 }}
                placeholder="MIIBIjANBgkqhkiG9w0BAQEFA..." />

              <Accordion variant="outlined" disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={500}>Advanced options</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField select fullWidth label="Key Length" value={keyLength} onChange={e => setKeyLength(e.target.value)}>
                        <MenuItem value="112">112-bit (16 bytes) — double-length</MenuItem>
                        <MenuItem value="168">168-bit (24 bytes)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField select fullWidth label="Encoding Mode" value={mode} onChange={e => setMode(e.target.value)}>
                        <MenuItem value="HEX">HEX</MenuItem>
                        <MenuItem value="STRING">STRING — Base64</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Initialization Vector (hex)" value={ivHex}
                        onChange={e => setIvHex(e.target.value)}
                        placeholder={config?.encryption?.ivHex || '99999999999999999999999999999999'} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleGenerate} disabled={loading}>
                  {loading ? 'Encrypting…' : 'Generate Encrypted PIN'}
                </Button>
                <Button variant="outlined" color="inherit"
                  onClick={() => { setDeviceNumber(''); setClearPin(''); setResult(null); }}>
                  Clear
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
              <OutputBlock label="Encrypted PIN Payload (oldSourceBlock + oldSourceEncKey)" value={result?.body} defaultExpanded />
              <OutputBlock label="oldSourceBlock — encrypted PIN block" value={result?.oldSourceBlock} defaultExpanded />
              <OutputBlock label="oldSourceEncKey — RSA-wrapped DES key" value={result?.oldSourceEncKey} />
              <OutputBlock label="Clear PIN Block (ISO-0, hex)" value={result?.pinBlockClear} defaultExpanded />
              <OutputBlock label="Generated DES Key (hex)" value={result?.desKeyHex} />
              <OutputBlock label="ASN.1 DER-wrapped key (hex)" value={result?.asnHex} />
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
