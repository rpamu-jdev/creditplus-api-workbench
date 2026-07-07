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
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyIcon from '@mui/icons-material/Key';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import { useThemeVariant } from '../context/ThemeContext';
import type { ThemeVariant } from '../theme';

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
  const navigate = useNavigate();
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
              Pine Labs Credit+ Testing Tool
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
      </Box>

      {/* Theme switcher */}
      <Box sx={{
        px: 2, py: 1.5,
        borderTop: '1px solid', borderColor: 'divider',
      }}>
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

      {/* Footer status */}
      <Box sx={{
        px: 2, py: 1.2,
        borderTop: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%',
          bgcolor: 'success.main', flexShrink: 0,
          boxShadow: '0 0 0 3px rgba(34,197,94,0.18)',
        }} />
        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
          v2.0 · Pine Labs Credit+
        </Typography>
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
          <Typography variant="subtitle1" fontWeight={700}>APILeela</Typography>
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
    </Box>
  );
}
