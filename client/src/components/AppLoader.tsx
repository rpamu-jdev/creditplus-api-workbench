import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import BoltIcon from '@mui/icons-material/Bolt';
import { keyframes } from '@mui/system';

export const QUOTES = [
  // ── Classic Prabhu ki Leela ──────────────────────────────────────────────────
  { text: 'Prabhu ki leela — this API giveth 200, and taketh away with 500.', author: 'Ancient Dev Wisdom' },
  { text: 'Prabhu ki kripa se, HTTP 200 aaya. 500 aana tha, lekin usne maafi di.', author: 'HTTP Bhagavad Gita' },
  { text: 'Works in dev. Fails in prod. Prabhu ki leela hai bhai.', author: 'DevOps Ramayana' },
  { text: 'Error 404: Developer motivation not found. Deploying chai protocol.', author: 'Indian Backend Engineering' },
  { text: 'Deadline approaching. Prabhu, please don\'t let the tests fail.', author: 'Every Sprint, Every Time' },

  // ── IT Classics ──────────────────────────────────────────────────────────────
  { text: 'It works on my machine. Perhaps we should ship my machine.', author: 'Every Developer Ever' },
  { text: 'Have you tried turning it off and on again? Prabhu definitely has.', author: 'IT Crowd, Pine Labs Edition' },
  { text: 'console.log("why God why") — a valid debugging strategy since 1995.', author: 'Stack Overflow, 3 AM' },
  { text: 'This code works. I have no idea why. Please don\'t ask.', author: 'Senior Engineer, Friday 5 PM' },
  { text: 'The network is fine. It\'s definitely not the network. …It\'s the network.', author: 'Backend Dev, Always' },
  { text: 'Sir, this is an API endpoint. But also, namaste.', author: 'Pine Labs Support Bot' },
  { text: 'Encryption: turning readable mistakes into unreadable ones since forever.', author: 'A Tired Cryptographer' },
  { text: 'The best code is no code. Unfortunately, someone still has to write no code.', author: 'Zen of Python' },
  { text: 'My code doesn\'t have bugs. It develops random features.', author: 'Optimistic Engineer' },
  { text: '99 little bugs in the code. Fix one, patch it around — 127 bugs in the code.', author: 'Dev Folklore' },
  { text: 'We have two hard problems in CS: naming things, cache invalidation, and off-by-one errors.', author: 'Phil Karlton, Revised Edition' },
  { text: 'In the beginning was the Word, and the Word was `undefined`.', author: 'JavaScript Genesis 1:1' },
  { text: 'sudo make me a sandwich. The server said 403 Forbidden.', author: 'Linux Command Line Chronicles' },
  { text: 'The cloud is just someone else\'s computer silently judging your architecture.', author: 'Cloud Computing Truth' },
  { text: 'chmod 777 and pray. Classic enterprise security.', author: 'InfoSec Nightmare Journal' },

  // ── Mythical IT Mix ───────────────────────────────────────────────────────────
  { text: 'Hanuman crossed the ocean in one leap. Our request crossed the firewall in three retries.', author: 'Network Engineering Valmiki' },
  { text: 'Indra sent the thunderbolt. The API timed out before it arrived.', author: 'DevOps Mahabharata' },
  { text: 'Lord Brahma created the universe in six days. Our CI/CD pipeline takes seven.', author: 'DevOps Vedas' },
  { text: 'Shiva destroyed the universe. Our memory leak is doing the same, just slower.', author: 'Production Incident Log' },
  { text: 'Even Vishwakarma\'s divine forge couldn\'t compile this Dockerfile on the first try.', author: 'CI/CD Puranas' },
  { text: 'Drona could teach archery blindfolded. I still can\'t center a div.', author: 'CSS Mahabharata' },
  { text: 'The stack trace is 400 lines long. Like the Ramayana — beautiful, but hard to follow.', author: 'Ancient Debug Chronicles' },
  { text: 'Krishna said "Do your duty without attachment to results." Git push --force anyway.', author: 'Bhagavad Git' },
  { text: 'Arjuna had a moment of doubt before battle. We have one before every deployment.', author: 'Kurukshetra DevOps' },
  { text: 'The Pandavas lost everything in a dice game. We lost prod in a typo.', author: 'Database Migration Mahabharata' },
  { text: 'Maya (illusion) is the root of all suffering. So is legacy code.', author: 'Vedantic Software Philosophy' },
  { text: 'Ravan had 10 heads. Our monolith has 10 microservices pretending to be one.', author: 'Architecture Ramayana' },
];

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const iconPulse = keyframes`
  0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,0.4); }
  50%       { box-shadow: 0 8px 48px rgba(99,102,241,0.7); }
`;

const boltSpin = keyframes`
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(-10deg) scale(1.1); }
  75%  { transform: rotate(10deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
`;

export default function AppLoader({ message = 'Loading configuration…' }: { message?: string }) {
  const [qIdx, setQIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQIdx(i => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 350);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[qIdx];

  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #f8fafc 0%, #eef2ff 40%, #faf5ff 70%, #f0fdf4 100%)',
    }}>
      {/* Decorative blobs */}
      <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', top: '10%', left: '15%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', bottom: '15%', right: '10%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', maxWidth: 500, px: 4,
        animation: `${fadeInUp} 0.6s cubic-bezier(0.16,1,0.3,1)`,
      }}>
        {/* Brand icon */}
        <Box sx={{
          width: 72, height: 72, borderRadius: 4.5, mb: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: `${iconPulse} 2.5s ease-in-out infinite`,
        }}>
          <Box sx={{ animation: `${boltSpin} 3s ease-in-out infinite` }}>
            <BoltIcon sx={{ color: '#fff', fontSize: 36 }} />
          </Box>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', mb: 0.5 }}>
          APILeela
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
          Pine Labs Credit+ Testing Tool
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mb: 4 }}>
          {message}
        </Typography>

        {/* Progress bar */}
        <Box sx={{ width: '100%', mb: 5 }}>
          <LinearProgress sx={{
            borderRadius: 99, height: 3,
            bgcolor: 'rgba(99,102,241,0.1)',
            '& .MuiLinearProgress-bar': { borderRadius: 99 },
          }} />
        </Box>

        {/* Quote */}
        <Box sx={{
          p: 2.5, borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.1)',
          boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          minHeight: 90,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <Typography variant="body2" color="text.secondary"
            sx={{ fontStyle: 'italic', lineHeight: 1.75, mb: 1 }}>
            "{q.text}"
          </Typography>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
            — {q.author}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
