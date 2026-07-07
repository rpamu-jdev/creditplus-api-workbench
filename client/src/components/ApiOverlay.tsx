import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { keyframes } from '@mui/system';
import { QUOTES } from './AppLoader';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

export default function ApiOverlay() {
  const [qIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const q = QUOTES[qIdx];

  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 1300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      animation: `${fadeIn} 0.25s ease`,
    }}>
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 4,
        p: 4,
        maxWidth: 480,
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        border: '1px solid rgba(99,102,241,0.15)',
        animation: `${slideUp} 0.3s cubic-bezier(0.16,1,0.3,1)`,
      }}>
        {/* Spinner */}
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2.5 }}>
          <CircularProgress size={44} thickness={3} />
          <Box sx={{
            position: 'absolute',
            inset: -10, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          }} />
        </Box>

        {/* Label */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
          Calling Pine Labs API…
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
          Hang tight, encryption in progress
        </Typography>

        {/* Quote — one random quote per API call, stays fixed for the duration */}
        <Box sx={{
          p: 2.5,
          borderRadius: 2.5,
          bgcolor: 'grey.50',
          border: '1px solid',
          borderColor: 'divider',
          minHeight: 90,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          animation: `${fadeIn} 0.5s ease`,
        }}>
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.75, mb: 1 }}
          >
            "{q.text}"
          </Typography>
          <Typography variant="caption" fontWeight={700} color="primary.main">
            — {q.author}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
