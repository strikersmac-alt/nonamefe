import { Box, Flex, Heading, Text, Button, Container } from '@radix-ui/themes';
import { HomeIcon, RocketIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '70px',
    }}>
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Container size="2" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem 5rem 1rem' }}>
        <Flex direction="column" align="center" gap="6" style={{ textAlign: 'center' }}>
          {/* 404 Illustration */}
          <Box style={{ position: 'relative' }}>
            <Heading 
              size="9" 
              style={{
                fontSize: 'clamp(6rem, 15vw, 12rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.05em',
                lineHeight: 1,
                opacity: 0.9,
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              404
            </Heading>
          </Box>

          {/* Error Message */}
          <Flex direction="column" gap="3" style={{ maxWidth: '500px' }}>
            <Heading 
              size="7" 
              style={{
                color: 'rgba(226, 232, 240, 0.95)',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Oops! Page Not Found
            </Heading>
            
            <Text 
              size="4" 
              style={{ 
                color: 'rgba(226, 232, 240, 0.75)',
                lineHeight: 1.6,
              }}
            >
              The page you're looking for seems to have vanished into thin air. 
              It might have been moved, deleted, or perhaps it never existed.
            </Text>
          </Flex>

          {/* Action Buttons */}
          <Flex gap="3" wrap="wrap" justify="center" mt="2">
            <Button
              size="3"
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                fontWeight: 600,
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
              }}
              className="feature-card"
            >
              <HomeIcon width={18} height={18} />
              Back to Home
            </Button>

            <Button
              size="3"
              variant="soft"
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 600,
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
              }}
            >
              Go Back
            </Button>
          </Flex>

          {/* Quick Links */}
          <Box mt="4" style={{
            padding: '1.5rem',
            background: 'rgba(35, 54, 85, 0.35)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '1rem',
            maxWidth: '450px',
            width: '100%',
          }}>
            <Text size="2" weight="bold" mb="3" style={{ 
              color: 'rgba(226, 232, 240, 0.9)',
              display: 'block',
            }}>
              Looking for something? Try these:
            </Text>
            
            <Flex direction="column" gap="2">
              <Box
                onClick={() => navigate('/create-contest')}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
                className="highlight-card"
              >
                <Flex align="center" gap="2">
                  <RocketIcon width={16} height={16} style={{ color: '#a78bfa' }} />
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                    Create a Contest
                  </Text>
                </Flex>
              </Box>

              <Box
                onClick={() => navigate('/join-contest')}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
                className="highlight-card"
              >
                <Flex align="center" gap="2">
                  <RocketIcon width={16} height={16} style={{ color: '#60a5fa' }} />
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                    Join a Contest
                  </Text>
                </Flex>
              </Box>

              <Box
                onClick={() => navigate('/practice')}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
                className="highlight-card"
              >
                <Flex align="center" gap="2">
                  <RocketIcon width={16} height={16} style={{ color: '#22c55e' }} />
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                    Practice NPTEL
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Box>

          {/* Fun Message */}
          <Text 
            size="2" 
            style={{ 
              color: 'rgba(226, 232, 240, 0.5)',
              fontStyle: 'italic',
              marginTop: '1rem',
            }}
          >
            "Not all who wander are lost... but this page sure is!" 🚀
          </Text>
        </Flex>
      </Container>

      {/* Footer Branding */}
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
