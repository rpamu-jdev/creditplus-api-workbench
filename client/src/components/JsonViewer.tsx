import { useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import { useTheme, alpha } from '@mui/material/styles';
import { highlightJson, highlightJsonLight } from '../utils/jsonHighlight';

interface Props {
  value: unknown;
}

const FF  = '"Roboto Mono","Cascadia Code","Fira Code",monospace';
const FS  = '0.78rem';
const LH  = 1.6;
const PAD = '10px 12px';

export default function JsonViewer({ value }: Props) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gutterRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLPreElement>(null);

  let str: string;
  if (value === null || value === undefined) {
    str = '—';
  } else if (typeof value === 'string') {
    try { str = JSON.stringify(JSON.parse(value), null, 2); }
    catch { str = value; }
  } else {
    try { str = JSON.stringify(value, null, 2); }
    catch { str = String(value); }
  }

  const isEmpty = str === '—';
  const lines   = str.split('\n').length;

  // Explicit colours — no reliance on MUI computed action palette
  const bg          = theme.palette.background.paper;
  const gutterBg    = isDark ? alpha(theme.palette.background.default, 0.6) : '#eef1f6';
  const gutterBdr   = `2px solid ${alpha(theme.palette.primary.main, 0.15)}`;
  const lineNumColor = isDark ? '#475569' : '#94a3b8';
  const textColor   = isDark ? '#e2e8f0' : '#374151';
  const scrollThumb = isDark ? '#334155' : '#cbd5e1';
  const scrollTrack = isDark ? alpha('#000', 0.2) : '#f1f5f9';

  const syncScroll = useCallback(() => {
    if (gutterRef.current && contentRef.current) {
      gutterRef.current.scrollTop = contentRef.current.scrollTop;
    }
  }, []);

  if (isEmpty) {
    return (
      <Box sx={{ p: 2, bgcolor: bg, fontFamily: FF, fontSize: FS, color: 'text.disabled' }}>
        —
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: bg, overflow: 'hidden' }}>

      {/* Line-number gutter */}
      <Box
        ref={gutterRef}
        sx={{
          overflow: 'hidden', flexShrink: 0,
          bgcolor: gutterBg,
          borderRight: gutterBdr,
          minWidth: 44, pt: PAD.split(' ')[0], pb: PAD.split(' ')[0], px: '8px',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: lines }, (_, i) => (
          <Box key={i} sx={{
            fontFamily: FF, fontSize: FS, lineHeight: LH,
            color: lineNumColor,
            textAlign: 'right', display: 'block',
          }}>
            {i + 1}
          </Box>
        ))}
      </Box>

      {/* Highlighted content */}
      <Box
        ref={contentRef}
        component="pre"
        onScroll={syncScroll}
        sx={{
          flex: 1, m: 0, p: PAD,
          fontFamily: FF, fontSize: FS, lineHeight: LH,
          color: textColor,
          overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxHeight: 420, overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 5, height: 5 },
          '&::-webkit-scrollbar-track': { bgcolor: scrollTrack },
          '&::-webkit-scrollbar-thumb': { bgcolor: scrollThumb, borderRadius: 3 },
        }}
        dangerouslySetInnerHTML={{ __html: isDark ? highlightJson(str) : highlightJsonLight(str) }}
      />
    </Box>
  );
}
