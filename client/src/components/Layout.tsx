import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyIcon from '@mui/icons-material/Key';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import { useThemeVariant } from '../context/ThemeContext';
import type { ThemeVariant } from '../theme';
import { QUOTES } from './AppLoader';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  group: 'pts' | 'tools';
}

const NAV: NavItem[] = [
  { label: 'Send Request',  path: '/',        icon: <SendIcon fontSize="small" />,     group: 'pts' },
  { label: 'Encrypt',       path: '/encrypt',  icon: <LockIcon fontSize="small" />,     group: 'pts' },
  { label: 'Decrypt',       path: '/decrypt',  icon: <LockOpenIcon fontSize="small" />, group: 'pts' },
  { label: 'PIN Encrypt',   path: '/pin',      icon: <KeyIcon fontSize="small" />,      group: 'pts' },
  { label: 'Logs',          path: '/logs',     icon: <ListAltIcon fontSize="small" />,  group: 'tools' },
  { label: 'Configuration', path: '/config',   icon: <SettingsIcon fontSize="small" />, group: 'tools' },
];

const THEME_OPTIONS: { id: ThemeVariant; label: string; bg: string; ring: string }[] = [
  { id: 'light', label: 'Light', bg: '#ffffff', ring: '#6366f1' },
  { id: 'dark',  label: 'Dark',  bg: '#1e293b', ring: '#818cf8' },
];

// ── Category order for quotes dialog ─────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  'Prabhu ki Leela':       '🙏 Prabhu ki Leela',
  'IT Classics':            '💻 IT Classics',
  'Mythical IT Mix':        '⚡ Mythical IT Mix',
  'PTS / Payment':          '💳 PTS / Payment',
  'More Prabhu ki Leela':   '🙏 More Prabhu ki Leela',
  'More Mythology':         '🕉️ More Mythology',
  'General Dev Humor':      '😄 General Dev Humor',
};

function categorizeName(author: string): string {
  if (/Prabhu|Sprint|Retry|Cache|Cosmic|On-Call|Merge/i.test(author) && !/Mythology|Puranas|Gita|Vedas|Mahabharata|Ramayana/i.test(author)) {
    if (/Retry|Cache|Cosmic|Sprint/i.test(author)) return 'More Prabhu ki Leela';
    return 'Prabhu ki Leela';
  }
  if (/PTS|PIN|DES|Token|Encrypted|Correlation|3DES|Payment|Cryptography/i.test(author)) return 'PTS / Payment';
  if (/Mahabharata|Ramayana|Puranas|Vedas|Bhagavad|Valmiki|Kurukshetra|Samudra|Karna|Yudhishthira/i.test(author)) {
    if (/Network|DevOps|CI\/CD|Architecture|Database|Access|SRE|Message|Git|Scheduled|Agile/i.test(author)) return 'More Mythology';
    return 'Mythical IT Mix';
  }
  if (/QA|Documentation|Legacy|naming|Senior dev|Kubernetes|Code Review|Self-Merge|Haiku|prod is down/i.test(author)) return 'General Dev Humor';
  return 'IT Classics';
}

function QuotesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const grouped = QUOTES.reduce<Record<string, typeof QUOTES>>((acc, q) => {
    const cat = categorizeName(q.author);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {});

  const categoryOrder = [
    'Prabhu ki Leela', 'More Prabhu ki Leela', 'IT Classics',
    'Mythical IT Mix', 'More Mythology', 'PTS / Payment', 'General Dev Humor',
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      PaperProps={{ sx: { borderRadius: 4, maxHeight: '88vh', overflow: 'hidden' } }}>

      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.85)} 100%)`,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        }}>
          <FormatQuoteIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} fontSize="1.05rem" sx={{ color: '#fff', lineHeight: 1.2 }}>
            Quote Book
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.72rem' }}>
            {QUOTES.length} quotes across {categoryOrder.filter(c => grouped[c]?.length).length} categories · APILeela wisdom
          </Typography>
        </Box>
        <Chip
          label={`${QUOTES.length} total`}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
            fontWeight: 700, fontSize: '0.68rem', border: '1px solid rgba(255,255,255,0.3)',
          }}
        />
      </Box>

      {/* Body */}
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {categoryOrder.map(cat => {
          const items = grouped[cat];
          if (!items?.length) return null;
          return (
            <Box key={cat}>
              {/* Sticky category header */}
              <Box sx={{
                px: 3, py: 1,
                position: 'sticky', top: 0, zIndex: 1,
                bgcolor: isDark ? alpha(theme.palette.background.paper, 0.96) : alpha('#f1f5f9', 0.97),
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{
                  width: 3, height: 16, borderRadius: 99,
                  background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  flexShrink: 0,
                }} />
                <Typography fontWeight={700} sx={{
                  fontSize: '0.72rem', letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'primary.main',
                }}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </Typography>
                <Chip
                  label={items.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, ml: 0.5 }}
                />
              </Box>

              {/* Quote cards */}
              <Box sx={{ px: 2.5, pt: 1.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map((q, i) => (
                  <Box key={i} sx={{
                    px: 2.5, py: 1.5, borderRadius: 2.5,
                    bgcolor: isDark ? alpha('#fff', 0.03) : '#fff',
                    border: '1px solid', borderColor: 'divider',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isDark ? alpha('#fff', 0.06) : alpha(theme.palette.primary.main, 0.04),
                      borderColor: alpha(theme.palette.primary.main, 0.25),
                      transform: 'translateX(2px)',
                    },
                  }}>
                    <FormatQuoteIcon sx={{
                      fontSize: 16, flexShrink: 0, mt: 0.25,
                      color: alpha(theme.palette.primary.main, 0.35),
                    }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2"
                        sx={{ fontStyle: 'italic', lineHeight: 1.7, color: 'text.primary', mb: 0.75 }}>
                        {q.text}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} fontSize="0.68rem"
                        sx={{ color: alpha(theme.palette.primary.main, 0.8) }}>
                        — {q.author}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </DialogContent>

      {/* Footer */}
      <Box sx={{
        px: 2.5, py: 1.5,
        borderTop: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 2,
        bgcolor: isDark ? alpha('#fff', 0.02) : alpha(theme.palette.primary.main, 0.02),
      }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, flex: 1,
          px: 1.5, py: 0.75, borderRadius: 2,
          border: '1px solid', borderColor: 'divider',
          bgcolor: isDark ? alpha('#fff', 0.03) : '#fff',
        }}>
          <Typography fontSize="0.8rem">🤫</Typography>
          <Box sx={{ width: '1px', height: 14, bgcolor: 'divider', mx: 0.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            You found the secret quote book
          </Typography>
          <Box sx={{ width: '1px', height: 14, bgcolor: 'divider', mx: 0.5 }} />
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1, py: 0.25, borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="caption" color="primary.main" fontWeight={700} fontSize="0.68rem">
              rpamu@extio.io
            </Typography>
            <Typography variant="caption" color="text.disabled" fontSize="0.65rem">
              · SDE II
            </Typography>
          </Box>
        </Box>
        <Button onClick={onClose} variant="contained" size="small"
          sx={{ borderRadius: 2, px: 2.5, flexShrink: 0 }}>
          Close
        </Button>
      </Box>
    </Dialog>
  );
}

function NavGroup({ label, items, current, onNavigate }: {
  label: string;
  items: NavItem[];
  current: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="caption" sx={{
        px: 2.5, py: 0.75, display: 'block',
        fontWeight: 700, letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: 'text.disabled',
        fontSize: '0.64rem',
      }}>
        {label}
      </Typography>
      <List dense disablePadding sx={{ px: 1 }}>
        {items.map(n => {
          const active = current === n.path;
          return (
            <ListItem key={n.path} disablePadding sx={{ mb: 0.25 }}>
              <Tooltip title={n.label} placement="right" disableHoverListener>
                <ListItemButton
                  selected={active}
                  onClick={() => onNavigate(n.path)}
                  sx={{
                    borderRadius: 2.5,
                    py: 0.85, px: 1.5,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                    ...(active ? {
                      bgcolor: t => alpha(t.palette.primary.main, 0.1),
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0, top: '20%', bottom: '20%',
                        width: 3, borderRadius: '0 3px 3px 0',
                        bgcolor: 'primary.main',
                      },
                    } : {
                      '&:hover': {
                        bgcolor: t => alpha(t.palette.primary.main, 0.06),
                        transform: 'translateX(2px)',
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 34,
                    color: active ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.18s ease',
                  }}>
                    {n.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={n.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 700 : 400,
                      color: active ? 'primary.main' : 'text.primary',
                      sx: { transition: 'all 0.18s ease' },
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quotesOpen, setQuotesOpen]       = useState(false);
  const [randomQuote, setRandomQuote]     = useState<typeof QUOTES[0] | null>(null);
  const [randomQuoteOpen, setRandomQuoteOpen] = useState(false);
  const navigate = useNavigate();

  function showRandomQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setRandomQuote(q);
    setRandomQuoteOpen(true);
  }
  const location = useLocation();
  const { variant, setVariant } = useThemeVariant();

  function handleNav(path: string) {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Box sx={{
        px: 2.5, py: 2.5,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`
          : 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.light} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            flexShrink: 0,
          }}>
            <BoltIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1} letterSpacing="-0.4px">
              APILeela
            </Typography>
            <Typography variant="caption" color="text.disabled" fontSize="0.67rem" fontWeight={500}>
              Testing Tool
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1.5 }}>
        <NavGroup
          label="PTS Tools"
          items={NAV.filter(n => n.group === 'pts')}
          current={location.pathname}
          onNavigate={handleNav}
        />
        <Box sx={{ height: '1px', bgcolor: 'divider', mx: 2, my: 1 }} />
        <NavGroup
          label="Workspace"
          items={NAV.filter(n => n.group === 'tools')}
          current={location.pathname}
          onNavigate={handleNav}
        />

        {/* Random Quote button */}
        <Box sx={{ px: 1, mt: 0.5 }}>
          <ListItemButton
            onClick={showRandomQuote}
            sx={{
              borderRadius: 2.5, py: 0.85, px: 1.5,
              transition: 'all 0.18s ease',
              background: t => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha(t.palette.primary.light, 0.05)})`,
              border: '1px dashed',
              borderColor: t => alpha(t.palette.primary.main, 0.2),
              '&:hover': {
                background: t => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.14)}, ${alpha(t.palette.primary.light, 0.1)})`,
                borderColor: 'primary.main',
                transform: 'translateX(2px)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'primary.main' }}>
              <AutoAwesomeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Random Quote"
              primaryTypographyProps={{
                fontSize: '0.875rem', fontWeight: 600,
                color: 'primary.main',
              }}
            />
          </ListItemButton>
        </Box>
      </Box>

      {/* Theme switcher */}
      <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.disabled" sx={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', display: 'block', mb: 1,
        }}>
          Theme
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {THEME_OPTIONS.map(opt => (
            <Tooltip key={opt.id} title={opt.label} placement="top">
              <Box
                onClick={() => setVariant(opt.id)}
                sx={{
                  width: 22, height: 22, borderRadius: '50%',
                  bgcolor: opt.bg,
                  border: '2px solid',
                  borderColor: variant === opt.id ? opt.ring : 'transparent',
                  outline: variant === opt.id ? `3px solid ${alpha(opt.ring, 0.3)}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: variant === opt.id
                    ? `0 0 0 1px ${opt.ring}`
                    : '0 1px 3px rgba(0,0,0,0.3)',
                  '&:hover': {
                    transform: 'scale(1.18)',
                    boxShadow: `0 0 0 2px ${opt.ring}`,
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Footer — hidden quote trigger */}
      <Box className="footer-row" sx={{
        px: 1.5, py: 1.2,
        borderTop: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 0.5,
        '&:hover .quote-btn': { opacity: 0.5 },
        '& .quote-btn:hover': { opacity: '1 !important' },
      }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          bgcolor: 'success.main',
          boxShadow: '0 0 0 3px rgba(34,197,94,0.18)',
          ml: 0.5,
        }} />
        <Typography variant="caption" color="text.secondary" fontSize="0.7rem" sx={{ flex: 1 }}>
          v2.0 · Pine Labs Credit+ Testing Tool
        </Typography>
        {/* Hidden trigger — only shows on hover of footer */}
        <Tooltip title="Quote Book 🤫" placement="top">
          <IconButton
            className="quote-btn"
            size="small"
            onClick={() => setQuotesOpen(true)}
            sx={{
              opacity: 0,
              width: 22, height: 22,
              transition: 'opacity 0.2s ease',
              color: 'text.disabled',
              borderRadius: 1,
            }}
          >
            <FormatQuoteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile AppBar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, display: { md: 'none' } }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(o => !o)} sx={{ color: 'text.primary' }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{
            width: 28, height: 28, borderRadius: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.light} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BoltIcon sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>Testing Tool</Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          mt: { xs: 8, md: 0 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {children}
      </Box>

      {/* Quote book dialog */}
      <QuotesDialog open={quotesOpen} onClose={() => setQuotesOpen(false)} />

      {/* Random Quote popup — backdrop */}
      <Fade in={randomQuoteOpen}>
        <Box
          onClick={() => setRandomQuoteOpen(false)}
          sx={{
            position: 'fixed', inset: 0, zIndex: 1399,
            bgcolor: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(4px)',
          }}
        />
      </Fade>

      {/* Random Quote popup — centered card */}
      <Fade in={randomQuoteOpen}>
        <Paper elevation={12} sx={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1400,
          width: { xs: '90vw', sm: 460 },
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: t => alpha(t.palette.primary.main, 0.2),
          boxShadow: t => `0 24px 64px ${alpha(t.palette.primary.main, 0.22)}, 0 8px 24px rgba(0,0,0,0.18)`,
        }}>
          {/* Header bar */}
          <Box sx={{
            px: 2, py: 1,
            background: t => `linear-gradient(135deg, ${t.palette.primary.dark}, ${t.palette.primary.light})`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }} />
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                RANDOM QUOTE
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Another one" placement="top">
                <IconButton size="small" onClick={showRandomQuote}
                  sx={{ color: 'rgba(255,255,255,0.85)', width: 24, height: 24, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                  <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setRandomQuoteOpen(false)}
                sx={{ color: 'rgba(255,255,255,0.85)', width: 24, height: 24, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                <CloseIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Quote body */}
          <Box sx={{ px: 2.5, py: 2, bgcolor: 'background.paper' }}>
            <FormatQuoteIcon sx={{ fontSize: 20, color: t => alpha(t.palette.primary.main, 0.25), mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.75, color: 'text.primary', mb: 1.25 }}>
              {randomQuote?.text}
            </Typography>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 1.25, py: 0.4, borderRadius: 99,
              bgcolor: t => alpha(t.palette.primary.main, 0.08),
            }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant="caption" color="primary.main" fontWeight={700} fontSize="0.68rem">
                {randomQuote?.author}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>

    </Box>
  );
}
