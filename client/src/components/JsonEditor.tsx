import { useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { useTheme, alpha } from '@mui/material/styles';
import { highlightJson, highlightJsonLight } from '../utils/jsonHighlight';

// These MUST match exactly between the overlay <pre> and the <textarea>
const FF      = '"Roboto Mono","Cascadia Code","Fira Code",monospace';
const FS      = '0.8rem';
const LH      = 1.65;
const LH_REM  = 0.8 * 1.65; // 1.32rem
const PAD_TOP = 10;

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  onFormat?: () => void;
  onClear?: () => void;
}

export default function JsonEditor({
  value, onChange, label = 'JSON', hint, placeholder,
  rows = 8, onFormat, onClear,
}: Props) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [copied, setCopied]         = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef    = useRef<HTMLDivElement>(null);

  const displayedLines = Math.max((value || '').split('\n').length, rows);

  // ── explicit dark / light colours (never rely on MUI computed action palette) ─
  const bodyBg         = theme.palette.background.paper;
  const gutterBg       = isDark ? alpha(theme.palette.background.default, 0.6) : '#eef1f6';
  const gutterBorder   = `2px solid ${alpha(theme.palette.primary.main, 0.18)}`;
  const lineNumColor   = isDark ? '#475569' : '#64748b';
  const baseTextColor  = isDark ? '#e2e8f0' : '#1e1e1e';
  const caretColor     = theme.palette.primary.main;
  const headerBg       = isDark ? alpha('#fff', 0.05) : '#f1f5f9';
  const placeholderCol = isDark ? '#3d4f62' : '#bbb';
  const scrollThumb    = isDark ? '#334155' : '#ccc';
  const scrollTrack    = isDark ? alpha('#000', 0.2) : '#f1f1f1';

  // ── helpers ─────────────────────────────────────────────────────────────────

  function copy() {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  function handleFormat() {
    if (onFormat) { onFormat(); return; }
    try { onChange(JSON.stringify(JSON.parse(value), null, 2)); }
    catch { /* invalid JSON */ }
  }

  function handleClear() {
    if (onClear) { onClear(); return; }
    onChange('');
  }

  function updateActiveLine() {
    const ta = textareaRef.current;
    if (!ta) return;
    const line = ta.value.substring(0, ta.selectionStart).split('\n').length - 1;
    setActiveLine(line);
  }

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop  = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{
      borderRadius: 2, overflow: 'hidden',
      border: '1.5px solid', borderColor: 'divider',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      '&:focus-within': {
        borderColor: 'primary.main',
        boxShadow: t => `0 0 0 3px ${alpha(t.palette.primary.main, 0.15)}`,
      },
    }}>

      {/* ── Header bar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.75,
        px: 1.5, py: 0.6,
        bgcolor: headerBg,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <DataObjectIcon sx={{ fontSize: 13, color: 'primary.main', flexShrink: 0 }} />

        <Typography variant="caption" fontWeight={700} sx={{
          color: 'text.secondary', fontSize: '0.67rem',
          textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1,
        }}>
          {label}
        </Typography>

        {hint && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem' }}>
            {hint}
          </Typography>
        )}

        {activeLine !== null && (
          <Typography variant="caption" sx={{
            color: 'primary.main', fontSize: '0.6rem', fontWeight: 600,
            bgcolor: t => alpha(t.palette.primary.main, 0.1), px: 0.75, py: 0.1, borderRadius: 0.75,
          }}>
            Ln {activeLine + 1}
          </Typography>
        )}

        <Typography variant="caption" sx={{
          color: 'text.disabled', fontSize: '0.6rem',
          bgcolor: 'action.selected', px: 0.75, py: 0.1, borderRadius: 0.75,
        }}>
          {(value || '').split('\n').length}L
        </Typography>

        <Tooltip title="Format JSON">
          <span>
            <IconButton size="small" onClick={handleFormat} disabled={!value}
              sx={{ p: 0.4, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              <AutoFixHighIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <span>
            <IconButton size="small" onClick={copy} disabled={!value}
              sx={{ p: 0.4, color: copied ? 'success.main' : 'text.secondary', transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}>
              <ContentCopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Clear">
          <span>
            <IconButton size="small" onClick={handleClear} disabled={!value}
              sx={{ p: 0.4, color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
              <DeleteOutlineIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* ── Editor body ── */}
      <Box sx={{ display: 'flex', bgcolor: bodyBg, position: 'relative' }}>

        {/* Line-number gutter */}
        <Box
          ref={gutterRef}
          sx={{
            overflow: 'hidden', flexShrink: 0,
            bgcolor: gutterBg,
            borderRight: gutterBorder,
            minWidth: 44, pt: `${PAD_TOP}px`, pb: `${PAD_TOP}px`, px: '8px',
            userSelect: 'none', position: 'relative',
          }}
        >
          {activeLine !== null && (
            <Box sx={{
              position: 'absolute', left: 0, right: 0,
              top: `calc(${PAD_TOP}px + ${activeLine} * ${LH_REM}rem)`,
              height: `${LH_REM}rem`,
              bgcolor: t => alpha(t.palette.primary.main, 0.18),
              borderRight: '2px solid',
              borderColor: 'primary.main',
              pointerEvents: 'none',
            }} />
          )}

          {Array.from({ length: displayedLines }, (_, i) => (
            <Box key={i} sx={{
              fontFamily: FF, fontSize: FS, lineHeight: LH,
              color: i === activeLine ? 'primary.main' : lineNumColor,
              fontWeight: i === activeLine ? 700 : 400,
              textAlign: 'right', display: 'block',
              position: 'relative', zIndex: 1,
              transition: 'color 0.1s, font-weight 0.1s',
            }}>
              {i + 1}
            </Box>
          ))}
        </Box>

        {/* Code pane */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {activeLine !== null && (
            <Box sx={{
              position: 'absolute', left: 0, right: 0, zIndex: 0,
              top: `calc(${PAD_TOP}px + ${activeLine} * ${LH_REM}rem)`,
              height: `${LH_REM}rem`,
              bgcolor: t => alpha(t.palette.primary.main, 0.07),
              pointerEvents: 'none',
            }} />
          )}

          {/* Syntax-highlighted overlay */}
          <Box
            component="pre"
            ref={highlightRef}
            aria-hidden
            sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              m: 0, p: `${PAD_TOP}px 12px`,
              fontFamily: FF, fontSize: FS, lineHeight: LH,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              color: baseTextColor,
              pointerEvents: 'none', overflow: 'hidden',
              tabSize: 2, zIndex: 1,
            }}
            dangerouslySetInnerHTML={{ __html: isDark ? highlightJson(value) : highlightJsonLight(value) }}
          />

          {/* Transparent textarea */}
          <Box
            component="textarea"
            ref={textareaRef}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              onChange(e.target.value);
              updateActiveLine();
            }}
            onKeyUp={updateActiveLine}
            onClick={updateActiveLine}
            onSelect={updateActiveLine}
            onFocus={updateActiveLine}
            onBlur={() => setActiveLine(null)}
            onScroll={syncScroll}
            placeholder={placeholder}
            rows={rows}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            sx={{
              display: 'block', boxSizing: 'border-box', width: '100%',
              position: 'relative', zIndex: 2,
              resize: 'none', border: 'none', outline: 'none',
              bgcolor: 'transparent',
              color: 'transparent',
              caretColor: caretColor,
              fontFamily: FF, fontSize: FS, lineHeight: LH,
              p: `${PAD_TOP}px 12px`, tabSize: 2,
              overflow: 'auto',
              [`&::placeholder`]: { color: placeholderCol },
              '&::-webkit-scrollbar': { width: 5, height: 5 },
              '&::-webkit-scrollbar-track': { bgcolor: scrollTrack },
              '&::-webkit-scrollbar-thumb': { bgcolor: scrollThumb, borderRadius: 3 },
            } as object}
          />
        </Box>
      </Box>
    </Box>
  );
}
