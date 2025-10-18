import { Box, Flex, Heading, Text, Card, Grid, Container } from '@radix-ui/themes';
import { LightningBoltIcon, GlobeIcon, RocketIcon, MixIcon, ChatBubbleIcon, LayersIcon, ReaderIcon, MagicWandIcon } from '@radix-ui/react-icons';
import '../App.css';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

// Typing animation hook
const useTypingEffect = (words: string[], typingSpeed = 150, deletingSpeed = 100, pauseDuration = 2000) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWordIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < word.length) {
          setCurrentText(word.slice(0, currentText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(word.slice(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return currentText;
};

const quizFeatures = [
  {
    icon: <RocketIcon width={28} height={28} />,
    title: 'Lightning-Fast AI',
    desc: 'Instant quiz generation on any topic. From history to science, we\'ve got you covered.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    icon: <GlobeIcon width={28} height={28} />,
    title: 'Multiple Game Modes',
    desc: 'Challenge friends in duels, host tournaments, or sharpen your skills solo.',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    icon: <LightningBoltIcon width={28} height={28} />,
    title: 'Host Competitions',
    desc: 'Create custom contests, invite players worldwide, and climb the leaderboards.',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
];

const QuizIllustration = () => (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="quiz-illustration">
    <defs>
      <linearGradient id="quizGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#764ba2" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="quizGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f093fb" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#f5576c" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="quizGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.9" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Main Quiz Card */}
    <g className="quiz-card" filter="url(#glow)">
      <rect x="100" y="120" width="200" height="160" rx="20" fill="url(#quizGrad1)" opacity="0.2" className="card-float" />
      <rect x="110" y="130" width="180" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#quizGrad1)" strokeWidth="2" />
    </g>

    {/* Question Mark - Large */}
    <g className="question-mark-main" filter="url(#glow)">
      <path d="M200 160 C 200 160 215 160 215 175 C 215 185 205 190 205 200 L 195 200 C 195 190 205 185 205 175 C 205 170 200 170 200 170"
        stroke="url(#quizGrad2)" strokeWidth="6" strokeLinecap="round" fill="none" className="pulse-stroke" />
      <circle cx="200" cy="215" r="4" fill="url(#quizGrad2)" className="pulse-node" />
    </g>

    {/* Floating Quiz Cards */}
    <g className="floating-cards">
      <rect x="80" y="80" width="60" height="40" rx="8" fill="url(#quizGrad2)" opacity="0.3" className="float-card-1" />
      <rect x="260" y="90" width="55" height="35" rx="8" fill="url(#quizGrad3)" opacity="0.3" className="float-card-2" />
      <rect x="75" y="270" width="50" height="30" rx="8" fill="url(#quizGrad1)" opacity="0.3" className="float-card-3" />
    </g>

    {/* Lightbulb - Idea */}
    <g className="lightbulb" filter="url(#glow)">
      <circle cx="140" cy="200" r="12" fill="none" stroke="url(#quizGrad3)" strokeWidth="3" className="bulb-glow" />
      <rect x="135" y="210" width="10" height="8" rx="2" fill="url(#quizGrad3)" opacity="0.6" />
      <path d="M 140 188 L 140 178" stroke="url(#quizGrad3)" strokeWidth="2" strokeLinecap="round" className="light-ray" />
      <path d="M 153 193 L 160 186" stroke="url(#quizGrad3)" strokeWidth="2" strokeLinecap="round" className="light-ray" />
      <path d="M 127 193 L 120 186" stroke="url(#quizGrad3)" strokeWidth="2" strokeLinecap="round" className="light-ray" />
    </g>

    {/* Trophy */}
    <g className="trophy" filter="url(#glow)">
      <path d="M 250 195 L 255 205 L 265 205 L 260 195 Z" fill="url(#quizGrad2)" className="trophy-float" />
      <rect x="253" y="205" width="9" height="8" fill="url(#quizGrad2)" opacity="0.7" />
      <rect x="250" y="213" width="15" height="3" rx="1" fill="url(#quizGrad2)" />
      <circle cx="257.5" cy="198" r="3" fill="#fbbf24" className="star-twinkle" />
    </g>

    {/* Checkmarks */}
    <g className="checkmarks">
      <path d="M 165 245 L 170 250 L 180 235" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-appear" opacity="0.7" />
      <path d="M 220 250 L 225 255 L 235 240" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-appear" opacity="0.7" style={{ animationDelay: '0.5s' }} />
    </g>

    {/* Stars */}
    <g className="stars">
      <circle cx="120" cy="140" r="2" fill="#fbbf24" className="star-twinkle" />
      <circle cx="280" cy="160" r="2.5" fill="#f472b6" className="star-twinkle" style={{ animationDelay: '0.7s' }} />
      <circle cx="290" cy="240" r="2" fill="#60a5fa" className="star-twinkle" style={{ animationDelay: '1.4s' }} />
      <circle cx="110" cy="250" r="2.5" fill="#a78bfa" className="star-twinkle" style={{ animationDelay: '1s' }} />
    </g>

    {/* Plus symbols */}
    <g className="plus-symbols" opacity="0.5">
      <path d="M 95 170 L 95 180 M 90 175 L 100 175" stroke="url(#quizGrad1)" strokeWidth="2" className="rotate-slow" />
      <path d="M 305 200 L 305 210 M 300 205 L 310 205" stroke="url(#quizGrad2)" strokeWidth="2" className="rotate-slow" />
    </g>
  </svg>
);

const FloatingOrbs = () => (
  <div className="floating-orbs">
    <div className="orb orb-1"></div>
    <div className="orb orb-2"></div>
    <div className="orb orb-3"></div>
  </div>
);

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const user = useAuthStore((state) => state.user);
  console.log(user);
  // Typing animation for dynamic text
  const typingText = useTypingEffect([
    'competitive duels',
    'live tournaments',
    'solo missions',
    'global leaderboards'
  ], 100, 70, 1800);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Box style={{
      minHeight: '100vh',
      background:
        'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '70px',
    }}>
      <FloatingOrbs />

      {/* Cursor glow effect */}
      <div
        className="cursor-glow"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
      />

      <Container size="3" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="6" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Flex direction={{ initial: 'column', md: 'row' }} justify="center" align="center" gap={{ initial: '5', md: '7' }} mt={{ initial: '3', md: '4' }}>
          {/* Enhanced Glassy Hero Card */}
          <Box className="hero-card" style={{
            flex: 1,
            minWidth: 'min(520px, 100%)',
            maxWidth: '720px',
            background: 'rgba(35, 54, 85, 0.35)',
            borderRadius: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: '0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(49, 84, 130, 0.4)',
            padding: 'clamp(1.75rem, 4vw, 2.5rem) clamp(2.5rem, 6vw, 4rem)',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
            position: 'relative',
          }}>
            <div className="card-shine"></div>


            <Heading size="9" className="glow-text-enhanced" style={{
              letterSpacing: '-0.02em',
              fontWeight: 800,
              marginBottom: '0.5rem',
              fontFamily: 'Poppins, sans-serif',
            }}>
              MindMuse
            </Heading>

            <Text size="6" as="p" style={{
              color: 'rgba(226, 232, 240, 0.95)',
              lineHeight: 1.6,
              fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
            }} mt="3">
              The AI-powered platform where learning meets competition. Challenge yourself in{' '}
              <span style={{
                color: '#f472b6',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f472b6, #fb7185)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                position: 'relative',
                display: 'inline-block',
                minWidth: '210px',
              }}>
                {typingText}
                <span style={{
                  borderRight: '2px solid #f472b6',
                  animation: 'blink 1s infinite',
                  marginLeft: '2px',
                }}></span>
              </span>
              <span style={{ display: 'block', marginTop: '0.65rem', color: 'rgba(226, 232, 240, 0.85)', fontSize: '0.9em', fontWeight: 500 }}>
                Master any subject. Anytime. Anywhere.
              </span>
            </Text>

            {/* Stats Section */}
            <Grid columns="3" gap="4" mt="4" style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Flex direction="column" align="center" gap="1" style={{ animation: 'stat-pop 0.6s ease-out 0.8s both' }}>
                <Text size="8" weight="bold" style={{
                  background: 'linear-gradient(135deg, #60a5fa, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                }}>100K+</Text>
                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.75rem' }}>Questions</Text>
              </Flex>
              <Flex direction="column" align="center" gap="1" style={{ animation: 'stat-pop 0.6s ease-out 1s both' }}>
                <Text size="8" weight="bold" style={{
                  background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                }}>AI</Text>
                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.75rem' }}>Powered</Text>
              </Flex>
              <Flex direction="column" align="center" gap="1" style={{ animation: 'stat-pop 0.6s ease-out 1.2s both' }}>
                <Text size="8" weight="bold" style={{
                  background: 'linear-gradient(135deg, #f472b6, #fb7185)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                }}>∞</Text>
                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.75rem' }}>Topics</Text>
              </Flex>
            </Grid>
          </Box>

          {/* Custom Quiz Illustration */}
          <Box style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <div className="illustration-container">
              <QuizIllustration />
            </div>
          </Box>
        </Flex>

        {/* Enhanced Features Grid */}
        <Grid columns={{ initial: '1', sm: '3' }} gap="5" mt={{ initial: '8', md: '10' }} px={{ initial: '0', sm: '0' }}>
          {quizFeatures.map((feat, i) => (
            <Card key={i} className="feature-card" asChild style={{
              background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
              boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              borderRadius: '1.8rem',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Flex direction="column" align="center" justify="center" gap="3" p="6" style={{ textAlign: 'center' }}>
                <div className="feature-glow" style={{ background: feat.gradient }}></div>

                <Box className="feature-icon-box" style={{
                  background: feat.gradient,
                  borderRadius: '50%',
                  width: 68,
                  height: 68,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 10px 30px ${feat.gradient.includes('667eea') ? 'rgba(102, 126, 234, 0.4)' : feat.gradient.includes('f093fb') ? 'rgba(240, 147, 251, 0.4)' : 'rgba(79, 172, 254, 0.4)'}`,
                  position: 'relative',
                  zIndex: 1,
                  margin: '0 auto',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}>
                  <Box style={{ color: 'white', transform: 'scale(1.1)' }}>
                    {feat.icon}
                  </Box>
                </Box>

                <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem', width: '100%' }}>
                  <Heading as="h3" size="5" style={{
                    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                  }}>
                    {feat.title}
                  </Heading>

                  <Text size="2" style={{
                    color: 'rgba(226, 232, 240, 0.8)',
                    lineHeight: 1.6,
                    maxWidth: '95%',
                    margin: '0 auto',
                    fontWeight: 400,
                  }}>
                    {feat.desc}
                  </Text>
                </Box>
              </Flex>
            </Card>
          ))}
        </Grid>

        {/* Enhanced Platform Description */}
        <Flex direction="column" align="center" mt={{ initial: '10', md: '12' }}>
          <div className="section-divider">
            <div className="divider-line"></div>
            <div className="divider-icon">
              <MixIcon width={20} height={20} />
            </div>
            <div className="divider-line"></div>
          </div>

          <Heading as="h2" size={{ initial: '7', sm: '8' }} className="glow-text-enhanced" style={{ fontWeight: 700, marginTop: '2rem', textAlign: 'center' }}>
            Why MindMuse?
          </Heading>

          <Text as="p" mt="5" size="4" style={{
            maxWidth: 640,
            textAlign: 'center',
            color: 'rgba(226, 232, 240, 0.85)',
            lineHeight: 1.8,
            fontSize: 'clamp(1rem, 2vw, 1.1rem)',
            padding: '0 1rem',
          }}>
            Experience the future of trivia gaming. Our AI engine generates unlimited unique questions tailored to your interests. Whether you're sharpening your skills solo, battling friends in real-time duels, or hosting tournaments for your community – MindMuse transforms learning into an addictive game.
          </Text>

          {/* Feature Highlights */}
          <Grid columns={{ initial: '1', sm: '2' }} gap="4" mt="7" style={{ maxWidth: 640, width: '100%' }}>
            {[
              {
                text: 'AI-Generated Questions',
                icon: <MagicWandIcon width={20} height={20} />,
                color: '#a78bfa',
                gradient: 'linear-gradient(135deg, #a78bfa, #c084fc)'
              },
              {
                text: 'Real-time Multiplayer',
                icon: <ChatBubbleIcon width={20} height={20} />,
                color: '#60a5fa',
                gradient: 'linear-gradient(135deg, #60a5fa, #818cf8)'
              },
              {
                text: 'Custom Contests',
                icon: <LayersIcon width={20} height={20} />,
                color: '#f472b6',
                gradient: 'linear-gradient(135deg, #f472b6, #fb7185)'
              },
              {
                text: 'Unlimited Topics',
                icon: <ReaderIcon width={20} height={20} />,
                color: '#4facfe',
                gradient: 'linear-gradient(135deg, #4facfe, #06b6d4)'
              },
            ].map((feature, i) => (
              <Flex key={i} align="center" gap="3" className="highlight-card" style={{
                padding: '1.2rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1.2rem',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}>
                <Box style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: feature.gradient,
                  borderRadius: '0.7rem',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${feature.color}40`,
                  color: 'white',
                }}>
                  {feature.icon}
                </Box>
                <Text size="3" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>{feature.text}</Text>
              </Flex>
            ))}
          </Grid>
        </Flex>
      </Container>

      {/* Enhanced Footer */}
      <Box className="footer" style={{
        width: '100%',
        marginTop: 'auto',
        padding: '1.5rem 1rem',
        textAlign: 'center',
        backdropFilter: 'blur(16px)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.6))',
        borderTop: '1px solid rgba(99, 102, 241, 0.15)',
        position: 'relative',
      }}>
        <Flex direction="column" align="center" gap="2">
          <Flex align="center" gap="2">
            <Box style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              animation: 'pulse 2s ease-in-out infinite',
            }}></Box>
            <Text size="3" weight="medium" style={{
              color: 'rgba(226, 232, 240, 0.9)',
              letterSpacing: '0.02em',
            }}>
              MindMuse
            </Text>
          </Flex>
          <Text size="1" style={{
            color: 'rgba(148, 163, 184, 0.7)',
            letterSpacing: '0.02em',
          }}>
            Unlock Your Curiosity
          </Text>
          <Text size="1" style={{
            color: 'rgba(148, 163, 184, 0.5)',
            marginTop: '0.25rem',
          }}>
            &copy; {new Date().getFullYear()} MindMuse. All rights reserved.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
