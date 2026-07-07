import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { keyframes } from '@mui/system';
import { QUOTES } from './AppLoader';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

interface Props {
  quoteIdx: number;
}

export default function TabLoader({ quoteIdx }: Props) {
  const q = QUOTES[quoteIdx % QUOTES.length];

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      px: 4,
      animation: `${fadeInUp} 0.3s ease-out`,
      background: 'linear-gradient(160deg, rgba(99,102,241,0.03) 0%, transparent 60%)',
    }}>
      {/* Spinner with glow ring */}
      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={52} thickness={2.5} />
        <Box sx={{
          position: 'absolute',
          width: 72, height: 72, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }} />
      </Box>

      {/* Main loading message */}
      <Typography variant="h6" fontWeight={700} sx={{ textAlign: 'center', letterSpacing: '-0.3px' }}>
        Prabhu ki leela… page load ho raha hai       </Typography>

      {/* Quote card */}
      <Box sx={{
        maxWidth: 520,
        textAlign: 'center',
        p: 3.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 32px rgba(99,102,241,0.08)',
      }}>
        <Typography
          sx={{
            fontSize: '1.1rem',
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'text.primary',
            lineHeight: 1.8,
            mb: 1.5,
          }}
        >
          "{q.text}"
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.8rem' }}>
          — {q.author}
        </Typography>
      </Box>

    </Box>
  );
}
