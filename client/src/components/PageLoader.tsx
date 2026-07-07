import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { keyframes } from '@mui/system';
import { QUOTES } from './AppLoader';

const fadeSlide = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

interface Props {
  message?: string;
  compact?: boolean;
}

export default function PageLoader({ message = 'Processing request…', compact = false }: Props) {
  const [qIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(qIdx);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx(i => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[currentIdx];

  if (compact) {
    return (
      <Box sx={{
        py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        animation: `${fadeSlide} 0.4s ease-out`,
      }}>
        <CircularProgress size={28} thickness={3.5} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5,
      animation: `${fadeSlide} 0.4s ease-out`,
    }}>
      {/* Spinner with glow */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={44} thickness={3} />
        <Box sx={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          animation: 'none',
        }} />
      </Box>

      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
        {message}
      </Typography>

      {/* Quote */}
      <Box sx={{
        maxWidth: 380, textAlign: 'center', mt: 1,
        p: 2, borderRadius: 2.5,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'divider',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.7, mb: 0.75 }}>
          "{q.text}"
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight={700}>
          — {q.author}
        </Typography>
      </Box>
    </Box>
  );
}
