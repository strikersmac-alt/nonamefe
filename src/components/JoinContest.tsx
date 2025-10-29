import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, TextField, Badge } from '@radix-ui/themes';
import { EnterIcon, StarFilledIcon, RocketIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { createUserContestAnalytics, createDailyUserAnalytics, createContestAnalytics } from '../services/analyticsService';
import '../App.css';
import useDocumentTitle from '../hooks/useDocumentTitle';
interface ContestMeta {
  code: string;
  mode: string;
  contestType: 'normal' | 'nptel';
  isLive: boolean;
  duration: number;
  startTime: string;
  timeZone: string;
  status: string;
  id: string;
  adminId: string;
  users: string[];
  capacity?: number;
}

export default function JoinContest() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle("MindMuse - Join Contest");
  // Auto-fill contest code from URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setContestCode(codeFromUrl);
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const currentUserId = user?._id; // Get current user ID
    try {
      // Fetch contest details by code
      const response = await axios.get<{ success: boolean; meta: ContestMeta }>(
        `${import.meta.env.VITE_API_URL}/api/contest/code/${contestCode}/questions`
      );

      if (response.data.success && response.data.meta) {
        const contestMeta = response.data.meta;
        const contestId = contestMeta.id;
        
        // Check if contest has ended - redirect to standings
        if (contestMeta.status === 'end') {
          navigate(`/contest/${contestMeta.id}/standings`, { 
            state: { contestMeta } 
          });
          return;
        }

        // Check if current user is already a participant or the admin
        const isParticipant = currentUserId && (contestMeta.users.includes(currentUserId) || contestMeta.adminId === currentUserId);

        // Contest is Live?
        if (contestMeta.isLive) {
          if (isParticipant) {
            // If already a participant, go to waiting room (it handles resume logic)
            // console.log("Contest live, user is participant, navigating to waiting room...");
            navigate(`/contest/${contestId}/waiting`, { state: { contestMeta } });
          } else {
            // If not a participant, go directly to view live standings
            // console.log("Contest live, user is observer, navigating to standings...");
            navigate(`/contest/${contestId}/standings`, { state: { contestMeta } });
          }
          return; // Stop further checks
        }

        // Contest is Waiting (Not Live, Not Ended)
        if (contestMeta.status === 'waiting') {
          const participantCount = contestMeta.users.length;
          // Determine capacity (handle different modes)
          const effectiveCapacity = contestMeta.mode === 'duel' ? 2 : contestMeta.capacity; // Default to 2 for duel

          if (isParticipant) {
             // Already joined, go to waiting room
            //  console.log("Contest waiting, user already participant, navigating to waiting room...");
             navigate(`/contest/${contestId}/waiting`, { state: { contestMeta } });
          } else if (effectiveCapacity && participantCount >= effectiveCapacity) {
             // Contest is full for new participants
            //  console.log("Contest waiting but full, navigating to standings...");
             setError(`Contest is full (Capacity: ${effectiveCapacity}). Viewing standings.`);
             // Allow viewing standings even if full
             setTimeout(() => navigate(`/contest/${contestId}/standings`, { state: { contestMeta } }), 2000); // Delay nav slightly
          } else {
             // Contest is waiting and has space (or no capacity limit)
            //  console.log("Contest waiting, user can join, navigating to waiting room...");
             // Proceed to waiting room to actually join via socket
             navigate(`/contest/${contestId}/waiting`, { state: { contestMeta } });
          }
          return; // Stop further checks
        }



        if (user?._id && contestMeta.contestType && contestMeta.mode) {
          const timestamp = Date.now();
          try {
            await createUserContestAnalytics(
              user._id,
              contestMeta.contestType,
              contestMeta.mode as 'duel' | 'practice' | 'multiplayer'
            );

            await createDailyUserAnalytics(
              user._id,
              timestamp,
              contestMeta.contestType,
              contestMeta.mode as 'duel' | 'practice' | 'multiplayer'
            );

            await createContestAnalytics(
              contestMeta.id,
              timestamp
            );
          } catch (analyticsError) {
            console.error('Analytics tracking failed:', analyticsError);
          }
        }

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
                Enter Code
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
                      placeholder="Enter code"
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
