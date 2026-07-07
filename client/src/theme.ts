import { createTheme, alpha } from '@mui/material/styles';

export type ThemeVariant = 'light' | 'dark';

// ─── Per-variant tokens ───────────────────────────────────────────────────────

const VARIANTS = {
  light: {
    muiMode: 'light' as const,
    primary:    { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    bg:         { default: '#f8fafc', paper: '#ffffff' },
    sidebar:    '#ffffff',
    sidebarBrand: 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
    divider:    'rgba(0,0,0,0.07)',
    inputBg:    '#ffffff',
    scrollThumb: '#cbd5e1',
    scrollTrack: 'transparent',
    accent:     '#6366f1',
    action: {
      hover:    'rgba(0,0,0,0.04)',
      selected: 'rgba(0,0,0,0.08)',
    },
  },
  dark: {
    muiMode: 'dark' as const,
    primary:    { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1' },
    bg:         { default: '#0f172a', paper: '#1e293b' },
    sidebar:    '#1e293b',
    sidebarBrand: 'linear-gradient(160deg, rgba(129,140,248,0.08) 0%, transparent 100%)',
    divider:    'rgba(255,255,255,0.08)',
    inputBg:    '#1e293b',
    scrollThumb: '#334155',
    scrollTrack: 'transparent',
    accent:     '#818cf8',
    action: {
      hover:    'rgba(255,255,255,0.06)',
      selected: 'rgba(255,255,255,0.12)',
    },
  },
} as const;

// ─── Factory ──────────────────────────────────────────────────────────────────

export function makeAppTheme(variant: ThemeVariant = 'light') {
  const V = VARIANTS[variant];

  return createTheme({
    palette: {
      mode: V.muiMode,
      primary: V.primary,
      background: V.bg,
      divider: V.divider,
      action: V.action,
    },
    shape: { borderRadius: 12 },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5:        { fontWeight: 700, letterSpacing: '-0.4px' },
      h6:        { fontWeight: 700, letterSpacing: '-0.3px' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body2:     { fontSize: '0.875rem' },
      caption:   { fontSize: '0.75rem' },
      button:    { textTransform: 'none', fontWeight: 600, letterSpacing: '0' },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { background: V.bg.default, transition: 'background 0.25s ease' },
          'code, pre': { fontFamily: '"Roboto Mono", "Courier New", monospace' },
          '*': { boxSizing: 'border-box' },
          '::-webkit-scrollbar':       { width: 6, height: 6 },
          '::-webkit-scrollbar-track': { background: V.scrollTrack },
          '::-webkit-scrollbar-thumb': { background: V.scrollThumb, borderRadius: 999 },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${V.divider}`,
            boxShadow: V.muiMode === 'light'
              ? '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)'
              : '0 1px 4px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
          },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true, variant: 'contained' },
        styleOverrides: {
          root: {
            borderRadius: 100,
            padding: '7px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: `0 4px 12px ${alpha(V.accent, 0.4)}` },
          },
          outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
          sizeSmall: { padding: '4px 12px', fontSize: '0.8rem' },
        },
      },

      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 10 } },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontSize: '0.875rem',
            backgroundColor: V.inputBg,
            '& fieldset': { borderColor: V.divider },
            '&:hover fieldset': { borderColor: V.accent },
            '&.Mui-focused fieldset': { borderWidth: '1.5px' },
          },
          input: { padding: '10px 14px' },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontSize: '0.875rem' } },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiSelect: {
        styleOverrides: { select: { fontSize: '0.875rem' } },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500, fontSize: '0.75rem', height: 26 },
          sizeSmall: { height: 22, fontSize: '0.7rem' },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontSize: '1.05rem', fontWeight: 700, paddingBottom: 8 } },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            minHeight: 40,
            borderRadius: 8,
            '&.Mui-selected': { fontWeight: 700 },
          },
        },
      },
      MuiTabs: {
        styleOverrides: { indicator: { height: 3, borderRadius: 99 } },
      },

      MuiAccordion: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: '12px !important',
            border: `1px solid ${V.divider}`,
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: { borderRadius: 12, minHeight: 44, '&.Mui-expanded': { minHeight: 44 } },
          content: { margin: '10px 0', '&.Mui-expanded': { margin: '10px 0' } },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '1px 6px',
            padding: '7px 12px',
            transition: 'all 0.15s ease',
            '&.Mui-selected': {
              backgroundColor: alpha(V.accent, 0.12),
              color: V.accent,
              fontWeight: 600,
              '&:hover': { backgroundColor: alpha(V.accent, 0.18) },
              '& .MuiListItemIcon-root': { color: V.accent },
            },
            '&:hover': { backgroundColor: alpha(V.accent, 0.07) },
          },
        },
      },

      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: V.sidebar,
            color: V.muiMode === 'light' ? '#0f172a' : undefined,
            borderBottom: `1px solid ${V.divider}`,
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${V.divider}`,
            boxShadow: 'none',
            background: V.sidebar,
          },
        },
      },

      MuiDivider: {
        styleOverrides: { root: { borderColor: V.divider } },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
            padding: '5px 10px',
            backgroundColor: V.muiMode === 'light' ? '#1e293b' : '#334155',
          },
          arrow: { color: V.muiMode === 'light' ? '#1e293b' : '#334155' },
        },
      },

      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12, fontWeight: 500 } },
      },

      MuiSwitch: {
        styleOverrides: {
          root: { padding: 6 },
          thumb: { boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
          track: { borderRadius: 99 },
          switchBase: { '&.Mui-checked': { transform: 'translateX(18px)' } },
        },
      },
    },
  });
}

// Default export for backward-compat (main.tsx imports this directly)
export default makeAppTheme('light');
