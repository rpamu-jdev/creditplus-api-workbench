import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alpha, useTheme } from '@mui/material/styles';
import JsonViewer from './JsonViewer';

interface Props {
  label: string;
  value: unknown;
  defaultExpanded?: boolean;
}

function displayText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

export default function OutputBlock({ label, value, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied]     = useState(false);
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  const text    = displayText(value);
  const isEmpty = text === '—';

  // Explicit colours — never fallback to MUI computed action.hover which may resolve light
  const headerBgCollapsed = isDark ? alpha('#fff', 0.05) : theme.palette.grey[50];
  const headerBgExpanded  = isDark
    ? alpha(theme.palette.primary.main, 0.18)
    : alpha(theme.palette.primary.main, 0.05);
  const headerBgHover     = isDark
    ? alpha(theme.palette.primary.main, 0.14)
    : alpha(theme.palette.primary.main, 0.07);
  const emptyBg = isDark ? alpha('#fff', 0.04) : theme.palette.grey[50];

  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!text || isEmpty) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <Box sx={{
      borderRadius: 1.5,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      '&:not(:last-child)': { mb: 1 },
    }}>
      {/* Header */}
      <Box
        onClick={() => setExpanded(e => !e)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.85, cursor: 'pointer',
          bgcolor: expanded ? headerBgExpanded : headerBgCollapsed,
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: headerBgHover },
        }}
      >
        <ExpandMoreIcon sx={{
          fontSize: 16,
          color: expanded ? 'primary.main' : 'text.disabled',
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s, color 0.2s',
          flexShrink: 0,
        }} />

        <Typography variant="body2" fontWeight={500} sx={{
          flex: 1, fontSize: '0.8rem',
          color: expanded ? 'text.primary' : 'text.secondary',
          transition: 'color 0.15s',
        }}>
          {label}
        </Typography>

        {!isEmpty && (
          <>
            <Typography variant="caption" sx={{
              color: 'text.disabled', fontSize: '0.65rem',
              bgcolor: isDark ? alpha('#fff', 0.08) : 'action.selected',
              px: 0.75, py: 0.15, borderRadius: 0.75, mr: 0.25,
            }}>
              {text.split('\n').length}L
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}>
              <IconButton size="small" onClick={copy}
                sx={{
                  p: 0.3,
                  color: copied ? 'success.main' : 'text.disabled',
                  transition: 'color 0.2s',
                  '&:hover': { color: 'primary.main' },
                }}>
                <ContentCopyIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Content */}
      <Collapse in={expanded} timeout={160}>
        {isEmpty
          ? (
            <Box sx={{
              px: 2, py: 1.5,
              fontFamily: '"Roboto Mono", monospace', fontSize: '0.78rem',
              color: 'text.disabled',
              bgcolor: emptyBg,
            }}>
              — no data —
            </Box>
          )
          : <JsonViewer value={value} />
        }
      </Collapse>
    </Box>
  );
}
