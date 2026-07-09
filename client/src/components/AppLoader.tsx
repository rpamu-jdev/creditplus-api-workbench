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
  { text: 'Works in dev. Fails in prod. Prabhu ki leela hai bhai.', author: 'Raj Kumar Pamu' },
  { text: 'Error 404: Developer motivation not found. Deploying chai protocol.', author: 'Indian Backend Engineering' },
  { text: 'Deadline approaching. Prabhu, please don\'t let the tests fail.', author: 'Every Sprint, Every Time' },

  // ── IT Classics ──────────────────────────────────────────────────────────────
  { text: 'It works on my machine. Perhaps we should ship my machine.', author: 'Every Developer Ever' },
  { text: 'Have you tried turning it off and on again? Prabhu definitely has.', author: 'IT Crowd, Pine Labs Edition' },
  { text: 'console.log("why God why") — a valid debugging strategy since 1995.', author: 'Stack Overflow, 3 AM' },
  { text: 'This code works. I have no idea why. Please don\'t ask.', author: 'Srinivas, every Friday 5 PM' },
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
  { text: 'Shiva destroyed the universe. Our memory leak is doing the same, just slower.', author: 'Shiva, Production Incident Log' },
  { text: 'Even Vishwakarma\'s divine forge couldn\'t compile this Dockerfile on the first try.', author: 'CI/CD Puranas' },
  { text: 'Drona could teach archery blindfolded. I still can\'t center a div.', author: 'CSS Mahabharata' },
  { text: 'The stack trace is 400 lines long. Like the Ramayana — beautiful, but hard to follow.', author: 'Ancient Debug Chronicles' },
  { text: 'Krishna said "Do your duty without attachment to results." Git push --force anyway.', author: 'Bhagavad Git' },
  { text: 'Arjuna had a moment of doubt before battle. We have one before every deployment.', author: 'Kurukshetra DevOps' },
  { text: 'The Pandavas lost everything in a dice game. We lost prod in a typo.', author: 'Database Migration Mahabharata' },
  { text: 'Maya (illusion) is the root of all suffering. So is legacy code.', author: 'Vedantic Software Philosophy' },
  { text: 'Ravan had 10 heads. Our monolith has 10 microservices pretending to be one.', author: 'Architecture Ramayana' },

  // ── PTS / Payment specific ───────────────────────────────────────────────────
  { text: 'The card was declined. The soul was also declined. It\'s a Monday.', author: 'PTS Error Log, 9:03 AM' },
  { text: 'DES key rotated. Prod broke. Chai break initiated.', author: 'Suraj, Post-Incident Review' },
  { text: 'The PIN block was wrong. So was everything else. But mostly the PIN block.', author: 'POS Terminal Confessions' },
  { text: 'Token expired. Dignity also expired. Please re-authenticate.', author: 'OAuth 2.0 Therapy Session' },
  { text: 'Response was encrypted. So were the developer\'s tears.', author: 'Cryptography Support Group' },
  { text: 'Correlation ID: generated. Cause of failure: unknown. Correlation: 0.', author: 'Distributed Tracing Paradox' },
  { text: '3DES: Three times the encryption, three times the confusion.', author: 'Symmetric Key Chronicles' },
  { text: 'Card present. Merchant present. Server? Not present.', author: 'Payment Gateway Haiku' },

  // ── More Prabhu ki Leela ─────────────────────────────────────────────────────
  { text: 'Ek baar aur try karo bhai, Prabhu ki marzi hogi.', author: 'Retry Logic, Indian Edition' },
  { text: 'Ab toh log bhi keh rahe hain: "Have you tried clearing the cache?"', author: 'Prabhu\'s Helpdesk' },
  { text: 'Prabhu ne kaha: ship karo. QA ne kaha: ruko. Prod ne kaha: bahut ho gaya.', author: 'Sprint Retrospective Purana' },
  { text: 'Cosmic timeout: even the universe has a 30s request limit.', author: 'Universal SLA Agreement' },

  // ── More Mythology ───────────────────────────────────────────────────────────
  { text: 'Narada Muni spread gossip across the cosmos. We call it event-driven architecture.', author: 'Message Queue Puranas' },
  { text: 'Ganesha removes obstacles. We remove him from the PR reviewer list.', author: 'Git Workflow Gita' },
  { text: 'Surya travels the sky daily. Our cron job runs at 2 AM and nobody notices.', author: 'Scheduled Task Vedas' },
  { text: 'The celestial ocean was churned for amrit. We churned Jira for a hotfix.', author: 'Samudra Manthan Agile' },
  { text: 'Karna was the best engineer but had no access to prod. Classic.', author: 'Mahabharata Access Control' },
  { text: 'Yudhishthira never lied except once. Our uptime SLA says 99.9%.', author: 'SRE Dharma' },

  // ── General Dev Humor ────────────────────────────────────────────────────────
  { text: 'A QA engineer walks into a bar. Orders 0 beers. Orders 99999 beers. Orders -1 beers.', author: 'Test Case Bar Jokes' },
  { text: 'Documentation: the love letter you write to your future self that you never send.', author: 'Tech Debt Anonymous' },
  { text: 'It\'s not a bug. It\'s an undocumented feature with job security built in.', author: 'Legacy Code Survival Guide' },
  { text: 'The first rule of naming variables: `data`, `data2`, `dataFinal`, `dataFinalFINAL`.', author: 'JavaScript Folklore' },
  { text: 'Senior dev advice: always code as if the person maintaining it is a violent psychopath who knows where you live.', author: 'Code Review Best Practices' },
  { text: 'Merge conflict on a file you never touched. Prabhu ki leela.', author: 'Git Blame Chronicles' },
  { text: 'prod is down. I am also down. We are all down together.', author: 'Uday Raj, On-Call 2 AM' },
  { text: 'Kubernetes: because nothing says "simple deployment" like 47 YAML files.', author: 'DevOps Complexity Report' },
  { text: 'The code review approved itself. Nobody asked questions. This is fine.', author: 'Self-Merge Support Forum' },

  // ── More Classic Prabhu ki Leela ────────────────────────────────────────────
  { text: 'Prabhu, why is the server returning 200 OK but the body says "Error"? Truly, your ways are mysterious.', author: 'REST API Upanishad' },
  { text: 'Maine toh keh diya tha — staging pe test karo. Unhone prod pe test kiya. Prabhu ki marzi.', author: 'Standup Meeting Purana' },
  { text: 'Prabhu ne khud deploy kiya hoga — kyunki koi aur itna brave nahi tha.', author: 'Friday Deploy Bhajan' },
  { text: 'Prabhu ki leela: 0 errors in linting, 47 errors in production.', author: 'ESLint Dharma' },
  { text: 'Bhai, kal tak kaam kar raha tha. Maine kuch nahi kiya. Prabhu ki shakti hai.', author: 'Hemanth, Git Blame Innocence' },
  { text: 'Chai pi lo, server restart ho jayega. Ye faith hai, code nahi.', author: 'DevOps Bhakti Marg' },
  { text: '"It\'s almost done" — Prabhu ki kasam, ye phrase sabse badi jhooth hai IT mein.', author: 'Sprint Planning Satya' },
  { text: 'Prabhu ne environment variables banaye. Humne unhe `.git` mein commit kiya. Maafi chahiye.', author: 'Security Incident Pravachan' },

  // ── More IT Classics ────────────────────────────────────────────────────────
  { text: 'There are only 10 types of people: those who understand binary and those who don\'t.', author: 'CS Fundamentals, Revisited' },
  { text: 'A programmer\'s wife says: "Go to the store, buy a loaf of bread. If they have eggs, get a dozen." He came back with 12 loaves.', author: 'Literal Thinking Quarterly' },
  { text: 'To err is human. To really foul things up, use a computer.', author: 'Paul Ehrlich, IT Edition' },
  { text: 'Weeks of coding can save you hours of planning.', author: 'Agile Inverse Law' },
  { text: 'Code never lies. Comments sometimes do. Commit messages always do.', author: 'Git Honesty Report' },
  { text: 'The engineer who wrote it left the company. The documentation was him.', author: 'Knowledge Transfer Horror' },
  { text: 'Always leave the codebase better than you found it. At least leave a note apologizing.', author: 'Boy Scout Rule, Amended' },
  { text: 'Rubber duck debugging: cheaper than therapy, almost as effective.', author: 'Quack-Driven Development' },
  { text: 'I don\'t always test my code, but when I do, I do it in production.', author: 'The Most Interesting Dev in the World' },
  { text: 'git commit -m "fix" is not a commit message. It is a confession.', author: 'Version Control Confessional' },
  { text: 'First law of debugging: the bug you\'re looking for is always in the last place you check.', author: 'Murphy\'s Law of Code' },
  { text: 'A function should do one thing. Our main() does 47.', author: 'Single Responsibility Violation' },
  { text: 'Deadline is a feature, not a constraint. The feature is panic.', author: 'Project Management Realism' },
  { text: 'Object-Oriented Programming: the art of turning a 5-line script into 17 classes.', author: 'Java Design Pattern Gazette' },
  { text: 'We ship. It breaks. We ship again. This is the way.', author: 'Agile Manifesto, Unfiltered' },
  { text: 'Stack Overflow is the real senior developer on every team.', author: 'Engineering Org Chart Truth' },
  { text: 'Regular expressions: write once, understand never.', author: 'Regex Survivor Journal' },
  { text: 'The code is self-documenting. The self it documents is a past version of you that made terrible decisions.', author: 'Technical Debt Archaeology' },
  { text: '"Move fast and break things" — great philosophy until you\'re on-call.', author: 'Silicon Valley Retrospective' },

  // ── More Mythical IT Mix ──────────────────────────────────────────────────────
  { text: 'Shakuni had loaded dice. Our load balancer also picks favorites.', author: 'Mahabharata Load Balancing' },
  { text: 'Parashurama destroyed the Kshatriyas 21 times. Our deployment script has run 21 rollbacks.', author: 'CI/CD Avatara Chronicles' },
  { text: 'Even Saraswati, goddess of knowledge, wouldn\'t document this codebase.', author: 'Legacy Docs Vedas' },
  { text: 'Ashwathama was cursed to live forever. So was this technical debt.', author: 'Immortal Tech Debt Purana' },
  { text: 'The Mahabharata war lasted 18 days. Our migration script has been running for 18 hours.', author: 'Database Migration Kurukshetra' },
  { text: 'Sahadeva knew the future but couldn\'t speak. Our monitoring knew prod was failing but nobody checked the alerts.', author: 'Observability Mahabharata' },
  { text: 'Dronacharya asked for Eklavya\'s thumb. We asked for root access. Same energy.', author: 'DevOps Guru Dakshhina' },
  { text: 'Vishnu sleeps on the cosmic ocean. Our database is also asleep. On-call has been paged.', author: 'SRE Vaishnava Purana' },
  { text: 'Lanka was built of gold. Our infrastructure is built of YAML and hope.', author: 'Architecture Ramayana v2' },

  // ── More PTS / Payment ────────────────────────────────────────────────────────
  { text: 'Transaction approved. Developer not approved. Please try again.', author: 'POS Terminal Feelings' },
  { text: 'The DES key was 24 bytes. The developer\'s patience was 0 bytes.', author: 'Symmetric Key Support Group' },
  { text: 'CVV correct. Expiry correct. Card number correct. Network timeout. Classic.', author: 'Payment Processor Grief Cycle' },
  { text: 'We encrypt the request. We encrypt the response. We forget to encrypt the logs. Rookie numbers.', author: 'PCI DSS Near-Miss Report' },
  { text: 'Amount: ₹1. Fees: ₹2. This is fine, the bank said.', author: 'Transaction Fee Philosophy' },
  { text: 'The merchant was not registered. The developer was also not registered for this level of stress.', author: 'Merchant Onboarding Diary' },
  { text: 'Idempotency: because charging the customer twice is only funny in staging.', author: 'Payment API Best Practices' },
  { text: 'Status: PENDING. Since: always. Forever. No update. Just vibes.', author: 'Async Transaction Chronicles' },
  { text: 'The sandbox worked perfectly. Production is a different religion entirely.', author: 'Environment Parity Prayers' },

  // ── More General Dev Humor ────────────────────────────────────────────────────
  { text: 'Works on my machine → we ship the machine → machine is a Docker container → container doesn\'t work either.', author: 'Containerization Support Group' },
  { text: 'An intern touched the production database. Silence fell over the land.', author: 'Intern Chronicles, Vol. 1' },
  { text: 'I love deadlines. I love the whooshing sound they make as they go by.', author: 'Douglas Adams, Developer Edition' },
  { text: 'Any sufficiently advanced bug is indistinguishable from a feature.', author: 'Clarke\'s Third Law of Debugging' },
  { text: 'There are two types of programmers: those who back up, and those who will.', author: 'Data Recovery Anonymous' },
  { text: 'Your test coverage is 100%. All tests pass. Prod is still on fire.', author: 'Confidence Interval Report' },
  { text: 'We don\'t have a monitoring problem. We have a "nobody reads the monitoring" problem.', author: 'Alert Fatigue Anonymous' },
  { text: 'New developer joined the team. Asked "why is this written this way?" Silence. Long silence.', author: 'Onboarding Horror Stories' },
  { text: 'The estimated time was 2 days. It has been 2 weeks. We are almost done.', author: 'Hofstadter\'s Law Survivor' },
  { text: 'If it hurts, do it more often. That\'s either CI/CD or masochism. Possibly both.', author: 'DevOps Philosophy' },
  { text: 'The scrum master said "no blockers?" We had 14 blockers. We said "no blockers."', author: 'Daily Standup Fiction' },
  { text: 'Deleted node_modules. Ran npm install. Still not sure what I have.', author: 'Node.js Existential Crisis' },
  { text: 'Legacy code is just future code that got tired.', author: 'Software Archaeology Institute' },
  { text: 'We rewrote it from scratch. The new version has all the original bugs plus creative new ones.', author: 'Rewrite Horror Report' },
  { text: 'The ticket said "small change". Three files became thirty. This is programming.', author: 'Rakesh, Scope Creep Chronicles' },
  { text: '"Ship it, we\'ll fix it later." — Later has never come. Later is a myth.', author: 'Backlog Anthropology' },
  { text: 'Junior dev: "Is this the right way to do it?" Senior dev: "There is no right way."', author: 'Software Enlightenment Koan' },
  { text: 'The pull request has 47 files changed. "Just a small refactor," they said.', author: 'Vinay, Code Review Nightmare' },
  { text: 'import everything from everywhere. JavaScript said yes. Bundle size said no.', author: 'Webpack Bundle Funeral' },
  { text: 'Works in Chrome. Broken in Safari. Explodes in IE. Technically cross-browser.', author: 'Frontend Compatibility Report' },

  // ── Raj Kumar Pamu ───────────────────────────────────────────────────────────
  { text: 'I didn\'t introduce the bug. I introduced an opportunity for someone else to find it.', author: 'Raj Kumar Pamu' },
  { text: 'The API spec said one thing. The API does another. I\'m just the middleman holding the chaos together.', author: 'Raj Kumar Pamu, Integration Layer' },
  { text: 'Ship it. If prod breaks, we\'ll call it a hotfix opportunity.', author: 'Raj Kumar Pamu, Release Day' },
  { text: 'I have tested this thoroughly — in my head.', author: 'Raj Kumar Pamu, QA Process' },

  { text: 'I don\'t have bugs in my code. I have surprise features that activate only in production, on Fridays, before a long weekend.', author: 'Raj Kumar Pamu, Feature Announcement' },
  { text: 'My commit message says "minor fix." The diff has 847 lines changed. I regret nothing.', author: 'Raj Kumar Pamu, Git Confessions' },
  { text: 'I told them it would take two days. I was talking about two days in a parallel universe where requirements don\'t change.', author: 'Raj Kumar Pamu, Estimation Theory' },
  { text: 'The senior dev reviewed my code and said "interesting approach." I still don\'t know if that\'s a compliment or a prayer.', author: 'Raj Kumar Pamu, Code Review Anxiety' },
  { text: 'I fixed the bug. In doing so, I discovered eleven more bugs. Net contribution: negative ten.', author: 'Raj Kumar Pamu, Bug Accounting' },
  { text: 'My architecture diagram made perfect sense at 1 AM. In daylight it looks like abstract art.', author: 'Raj Kumar Pamu, Design Doc Morning After' },
  { text: 'I deleted the logs to free up disk space. The logs were the only evidence of what was happening. Rookie mistake. Classic me.', author: 'Raj Kumar Pamu, Disk Management Confession' },
  { text: 'I know three things: how to code, how to look busy in meetings, and that the third thing will come to me.', author: 'Raj Kumar Pamu, SDE II Skills Matrix' },
  { text: 'Stack Overflow went down for one hour. I stared at my screen and questioned my entire career.', author: 'Raj Kumar Pamu, Dependency Crisis' },
  { text: 'My code is like biryani — layered, complex, slightly chaotic, and everyone has opinions on it.', author: 'Raj Kumar Pamu, Software Philosophy' },
  { text: 'I named the variable `temp` in 2019. It is still there. It is not temporary. Nothing is temporary.', author: 'Raj Kumar Pamu, Variable Archaeology' },
  { text: 'They gave me a prod access. I treated it like a toy. We don\'t talk about that deployment anymore.', author: 'Raj Kumar Pamu, Access Control Regrets' },

  // ── Srinivas ─────────────────────────────────────────────────────────────────
  { text: 'I know exactly what\'s wrong. I just need five more minutes. And a chai.', author: 'Srinivas, Debug Session Hour 4' },
  { text: 'We don\'t need more developers. We need the existing developers to stop breaking things.', author: 'Srinivas, Team Retrospective' },
  { text: 'The fix is simple. The root cause is deeply philosophical.', author: 'Srinivas, Post-Mortem Notes' },

  // ── Suraj ────────────────────────────────────────────────────────────────────
  { text: 'I ran the migration in prod before staging. It was a learning experience for everyone.', author: 'Suraj, Database Incident Log' },
  { text: 'Encryption is easy. Decrypting your own encrypted data two years later? That\'s the challenge.', author: 'Suraj, Crypto Regret Journal' },
  { text: 'I commented out that line "just to test". I forgot to uncomment it. That was six months ago.', author: 'Suraj, Code Archaeology' },

  // ── Shiva ────────────────────────────────────────────────────────────────────
  { text: 'I don\'t delete code. I deprecate it with dignity and leave it for someone else to delete.', author: 'Shiva, Cleanup Strategy' },
  { text: 'My git log is a novel. The protagonist keeps making the same mistake.', author: 'Shiva, Version History' },
  { text: 'Every system I touch either gets better or becomes a cautionary tale. No in-between.', author: 'Shiva, Performance Review' },

  // ── Hemanth ──────────────────────────────────────────────────────────────────
  { text: 'I asked for requirements. They said "you\'ll know when you see it." I\'ve shipped four versions. Still looking.', author: 'Hemanth, Product Discovery' },
  { text: 'My code is clean. The business logic, however, was written by chaos itself.', author: 'Hemanth, Clean Code Confession' },
  { text: 'I only push to main when I\'m confident. I am never confident. I push anyway.', author: 'Hemanth, Courage-Driven Development' },

  // ── Uday Raj ─────────────────────────────────────────────────────────────────
  { text: 'On-call is just another word for "you will not sleep and you will not know why."', author: 'Uday Raj, SRE Haiku' },
  { text: 'The alert fired at 3 AM. I acknowledged it. The issue acknowledged me back. We stared at each other.', author: 'Uday Raj, Incident Response Diary' },
  { text: 'I have rollback scripts for my rollback scripts. Sleep is a distant memory.', author: 'Uday Raj, DevOps Veteran' },

  // ── Rakesh ───────────────────────────────────────────────────────────────────
  { text: 'I estimated two days. It took two weeks. My estimation skills are consistently optimistic.', author: 'Rakesh, Sprint Planning Honesty' },
  { text: 'The requirement was clear. Until it wasn\'t. Until it changed. Until it changed back.', author: 'Rakesh, Requirements Archaeology' },
  { text: 'My local runs perfectly. I\'m starting to think the cloud just dislikes me personally.', author: 'Rakesh, Cloud Relationship Issues' },

  // ── Vinay ────────────────────────────────────────────────────────────────────
  { text: 'I reviewed my own PR. I left encouraging comments. This is not the process we agreed on.', author: 'Vinay, Self-Review Support Group' },
  { text: 'The unit tests all pass. What they\'re testing, nobody knows. But they pass.', author: 'Vinay, Test Coverage Illusion' },
  { text: 'I refactored it for clarity. It is now clarified chaos instead of mysterious chaos.', author: 'Vinay, Refactor Retrospective' },

  // ── Surya Dev ────────────────────────────────────────────────────────────────
  { text: 'Surya rises every morning without a standup call, no ticket, no jira update. Inspiration.', author: 'Surya Dev, DevOps Bhajan' },
  { text: 'I am Surya Dev — I shed light on bugs that others fear to look at.', author: 'Surya Dev, Bug Triage Philosophy' },
  { text: 'The build failed at sunrise. I fixed it by noon. Surya Dev keeps his SLA.', author: 'Surya Dev, CI Pipeline Chronicles' },
  { text: 'Like the sun, I appear in standups, shine briefly, and disappear before anyone can assign me more tasks.', author: 'Surya Dev, Meeting Strategy' },
  { text: 'My commits don\'t have bugs — they have shadow features that only appear in production at dawn.', author: 'Surya Dev, Prod Release Notes' },
  { text: 'Surya Dev: rotating through on-call, rotating through excuses, rotating through the same bugs every quarter.', author: 'Surya Dev, Quarterly Review' },
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
