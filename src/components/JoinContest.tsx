import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, TextField, Badge } from '@radix-ui/themes';
import { EnterIcon, StarFilledIcon, RocketIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import '../App.css';

interface ContestMeta {
  code: string;
  mode: string;
  isLive: boolean;
  duration: number;
  startTime: string;
  timeZone: string;
  id: string;
  adminId: string;
}

export default function JoinContest() {
  const navigate = useNavigate();
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fetch contest details by code
      const response = await axios.get<{ success: boolean; meta: ContestMeta }>(
        `http://localhost:10000/api/contest/code/${contestCode}/questions`
      );

      if (response.data.success && response.data.meta) {
        const contestMeta = response.data.meta;
        
        // Check if contest is already live
        // if (contestMeta.isLive) {
        //   setError('This contest has already started. You cannot join now.');
        //   return;
        // }

        // Navigate to waiting room with contest ID
        navigate(`/contest/${contestMeta.id}/waiting`, { 
          state: { contestMeta } 
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Contest not found. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
      display: 'flex',
      flexDirection: 'column',
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

      <Container size="3" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="6" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Back Button */}
        {/* <Button
          variant="soft"
          color="gray"
          size="2"
          onClick={() => navigate('/')}
          style={{
            marginBottom: '2rem',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ArrowLeftIcon /> Back to Home
        </Button> */}

        {/* Main Join Card */}
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Box className="hero-card" style={{
            width: '100%',
            maxWidth: '600px',
            background: 'rgba(35, 54, 85, 0.35)',
            borderRadius: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: '0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(49, 84, 130, 0.4)',
            padding: 'clamp(1.75rem, 4vw, 2.5rem) clamp(2.5rem, 6vw, 4rem)',
            position: 'relative',
          }}>
            <div className="card-shine"></div>

            <Flex direction="column" align="center" gap="4">
              <Badge size="2" color="violet" variant="soft" className="ai-badge" style={{ backdropFilter: 'blur(10px)' }}>
                <StarFilledIcon /> Join Contest
              </Badge>

              <Heading size="8" className="glow-text-enhanced" style={{
                letterSpacing: '-0.02em',
                fontWeight: 800,
                fontFamily: 'Poppins, sans-serif',
                textAlign: 'center',
              }}>
                Enter Contest Code
              </Heading>

              <Text size="3" as="p" style={{
                color: 'rgba(226, 232, 240, 0.85)',
                lineHeight: 1.6,
                textAlign: 'center',
                fontFamily: 'Poppins, sans-serif',
              }}>
                Enter the unique contest code provided by your host to join the competition.
              </Text>

              {/* Join Form */}
              <form onSubmit={handleJoin} style={{ width: '100%', marginTop: '1rem' }}>
                <Flex direction="column" gap="4">
                  <Box>
                    <TextField.Root
                      size="3"
                      placeholder="Enter 6-digit code"
                      value={contestCode}
                      onChange={(e) => setContestCode(e.target.value.toUpperCase())}
                      required
                      maxLength={6}
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'white',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        letterSpacing: '0.3em',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    />
                  </Box>

                  {error && (
                    <Card style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '1rem',
                    }}>
                      <Text size="2" style={{ color: '#ef4444', textAlign: 'center' }}>
                        {error}
                      </Text>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    size="3"
                    disabled={loading || contestCode.length !== 6}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      cursor: loading || contestCode.length !== 6 ? 'not-allowed' : 'pointer',
                      opacity: loading || contestCode.length !== 6 ? 0.7 : 1,
                      fontWeight: 600,
                    }}
                  >
                    {loading ? (
                      <>
                        <RocketIcon />
                        Joining...
                      </>
                    ) : (
                      <>
                        <EnterIcon />
                        Join Contest
                      </>
                    )}
                  </Button>
                </Flex>
              </form>
            </Flex>
          </Box>
        </Flex>
      </Container>

      {/* Footer */}
      <Box className="footer" style={{
        width: '100%',
        marginTop: 'auto',
        padding: '1rem',
        textAlign: 'center',
        backdropFilter: 'blur(16px)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.6))',
        borderTop: '1px solid rgba(99, 102, 241, 0.15)',
        position: 'relative',
      }}>
        <Flex direction="column" align="center" gap="1">
          <Text size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
            MindMuse
          </Text>
          <Text size="1" style={{ color: 'rgba(148, 163, 184, 0.7)', fontSize: '0.75rem' }}>
            Unlock Your Curiosity
          </Text>
          <Text size="1" style={{
            color: 'rgba(148, 163, 184, 0.5)',
            fontSize: '0.7rem',
          }}>
            &copy; {new Date().getFullYear()} MindMuse. All rights reserved.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
