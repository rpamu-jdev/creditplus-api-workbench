import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import type { AppConfig } from '../types';

const CARD_PALETTE: Record<string, { bg: string; border: string; dot: string; light: string }> = {
  credit:  { bg: '#fff1f2', border: '#f87171', dot: '#ef4444', light: '#fee2e2' },
  debit:   { bg: '#eff6ff', border: '#60a5fa', dot: '#3b82f6', light: '#dbeafe' },
  prepaid: { bg: '#f0fdf4', border: '#4ade80', dot: '#22c55e', light: '#dcfce7' },
  default: { bg: '#f8fafc', border: '#94a3b8', dot: '#64748b', light: '#f1f5f9' },
};

function palette(key: string) {
  return CARD_PALETTE[key.toLowerCase()] ?? CARD_PALETTE.default;
}

interface Props {
  config: AppConfig | null;
  activeCardType: string | null;
  onChange: (cardType: string | null) => void;
  showCustom?: boolean;
}

export default function CardTypePills({ config, activeCardType, onChange, showCustom = true }: Props) {
  const types = Object.keys(config?.cardTypes ?? {});

  if (!types.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No card types configured — go to Configuration first.
      </Typography>
    );
  }

  const selected = activeCardType ?? '';
  const pal = selected ? palette(selected) : CARD_PALETTE.default;

  return (
    <FormControl fullWidth size="small">
      <InputLabel>Card Type</InputLabel>
      <Select
        value={selected}
        label="Card Type"
        onChange={e => onChange(e.target.value || null)}
        renderValue={val => {
          const ct = config?.cardTypes[val];
          const p = palette(val);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.dot, flexShrink: 0 }} />
              <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                {ct?.label || val}
              </Typography>
            </Box>
          );
        }}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: pal.dot },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '2px' },
          transition: 'background-color 0.2s ease',
        }}
      >
        {types.map(k => {
          const ct = config!.cardTypes[k];
          const p = palette(k);
          return (
            <MenuItem key={k} value={k} sx={{
              mx: 0.5, borderRadius: 1.5, mb: 0.25, py: 0.75,
              '&:hover': { bgcolor: p.light },
              '&.Mui-selected': { bgcolor: p.bg, '&:hover': { bgcolor: p.light } },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.dot, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: p.dot, flex: 1 }}>
                  {ct.label || k}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                  {ct.endpoints?.length ?? 0} ep
                </Typography>
              </Box>
            </MenuItem>
          );
        })}

        {showCustom && (
          <MenuItem value="" sx={{ mx: 0.5, borderRadius: 1.5, mt: 0.25, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.400', flexShrink: 0 }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">Custom</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>— paste key below</Typography>
            </Box>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
}
