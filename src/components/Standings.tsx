import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, Badge, Avatar } from '@radix-ui/themes';
import { HomeIcon, StarFilledIcon, CheckCircledIcon, StarIcon } from '@radix-ui/react-icons';
import { io } from 'socket.io-client';
import LoadingSpinner from './LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import '../App.css';

interface Standing {
  userId: string;
  name: string;
  score: number;
}

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

export default function Standings() {
  const navigate = useNavigate();
  const { contestId } = useParams<{ contestId: string }>();
  const location = useLocation();
  const contestMeta = location.state?.contestMeta as ContestMeta;
  const finalScore = location.state?.finalScore as number;
  const fromProfile = location.state?.fromProfile as boolean;

  // const [socket, setSocket] = useState<Socket | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [contestInfo, setContestInfo] = useState<{ isLive: boolean; totalParticipants: number; capacity: number } | null>(null);
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?._id || '';

  // Prevent browser back button from going back to contest ONLY if user came from contest play
  // If finalScore exists and NOT from profile, it means user just completed the contest
  useEffect(() => {
    // Only block back navigation if user came from contest (has finalScore) and NOT from Profile
    if (finalScore !== undefined && !fromProfile) {
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
    // If fromProfile is true or no finalScore, allow normal back navigation
  }, [finalScore, fromProfile]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(`${import.meta.env.VITE_API_URL}`, {
      withCredentials: true,
    });

    // setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to socket, joining contest:', contestId);
      // Join contest room to receive standings updates
      socketInstance.emit('joinContest', contestId, (response: any) => {
        console.log('Join contest response:', response);
        if (response.success) {
          setLoading(false);
        } else {
          // Even if join fails (contest ended), still show standings
          setLoading(false);
        }
      });
    });

    socketInstance.on('updateStandings', (updatedStandings: Standing[]) => {
      console.log('Received standings:', updatedStandings);
      setStandings(updatedStandings);
      setLoading(false);
    });

    // Set initial contest info from contestMeta if available
    if (contestMeta) {
      setContestInfo({
        isLive: contestMeta.isLive,
        totalParticipants: 0,
        capacity: 0
      });
    }

    socketInstance.on('connect_error', () => {
      setLoading(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [contestId, navigate, contestMeta]);

  // Fetch contest info to get latest isLive status
  useEffect(() => {
    const fetchContestInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contest/${contestId}/questions`);
        const data = await response.json();
        if (data.success && data.meta) {
          setContestInfo({
            isLive: data.meta.isLive,
            totalParticipants: standings.length,
            capacity: 0
          });
        }
      } catch (error) {
        console.error('Error fetching contest info:', error);
      }
    };

    if (contestId) {
      fetchContestInfo();
    }
  }, [contestId, standings]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
      case 2:
        return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
      case 3:
        return 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  // const getRankIcon = (rank: number) => {
  //   if (rank <= 3) {
  //     return <StarIcon width={24} height={24} />;
  //   }
  //   return null;
  // };


  if (loading) {
    return <LoadingSpinner message="Loading standings..." />;
  }

  // const currentUserRank = standings.findIndex(s => s.userId === currentUserId) + 1;

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
        
        {/* Header Section */}
        <Flex direction="column" align="center" gap="4" mb="6">
          <Badge 
            size="3" 
            color={contestInfo?.isLive ? 'orange' : 'green'} 
            variant="soft" 
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <CheckCircledIcon />
            {contestInfo?.isLive ? 'Contest In Progress' : 'Contest Completed'}
          </Badge>

          <Heading size="9" className="glow-text-enhanced" style={{
            letterSpacing: '-0.02em',
            fontWeight: 800,
            fontFamily: 'Poppins, sans-serif',
            textAlign: 'center',
          }}>
            <StarIcon style={{ display: 'inline', marginRight: '0.5rem' }} />
            {contestInfo?.isLive ? 'Tentative Results' : 'Final Standings'}
          </Heading>
          
          {contestInfo?.isLive && (
            <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', textAlign: 'center' }}>
              Results will be finalized once all participants complete the contest
            </Text>
          )}

          {contestMeta && (
            <Flex gap="3" align="center" wrap="wrap" justify="center">
              <Badge size="2" color="violet" variant="soft">
                Contest: {contestMeta.code}
              </Badge>
              <Badge size="2" color="blue" variant="soft">
                {contestMeta.mode}
              </Badge>
            </Flex>
          )}

          {finalScore !== undefined && (
            <Card style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '1.5rem 2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <Flex direction="column" align="center" gap="2">
                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                  Your Score
                </Text>
                <Text size="8" weight="bold" style={{
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {finalScore}
                </Text>
              </Flex>
            </Card>
          )}
        </Flex>

        {/* Top 3 Winners - Simple List Style */}
        {standings.length >= 3 && (
          <Box mb="6" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
            <Flex direction="column" gap="2">
              {[standings[0], standings[1], standings[2]].map((standing, idx) => {
                const rank = idx + 1;
                const rankColors = {
                  1: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.6)', text: 'rgba(251, 191, 36, 0.95)' },
                  2: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.6)', text: 'rgba(148, 163, 184, 0.95)' },
                  3: { bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.6)', text: 'rgba(217, 119, 6, 0.95)' }
                };
                const colors = rankColors[rank as 1 | 2 | 3];
                
                return (
                  <Card key={standing.userId} style={{
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    backdropFilter: 'blur(20px)',
                    padding: '1rem',
                  }}>
                    <Flex align="center" gap="3">
                      <Badge size="2" style={{ background: getRankColor(rank), fontWeight: 800, minWidth: '35px' }}>
                        #{rank}
                      </Badge>
                      <Avatar size="3" fallback={standing.name.charAt(0).toUpperCase()} style={{ background: getRankColor(rank) }} />
                      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                        <Text size="3" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {standing.name}
                        </Text>
                      </Flex>
                      <Text size="4" weight="bold" style={{ color: colors.text, minWidth: '60px', textAlign: 'right' }}>
                        {standing.score}
                      </Text>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </Box>
        )}

        {/* Other Participants List - Only show if more than 3 participants */}
        {standings.length > 3 && (
        <Box className="hero-card" style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(35, 54, 85, 0.35)',
          borderRadius: '2rem',
          boxShadow: '0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(49, 84, 130, 0.4)',
          padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
          position: 'relative',
        }}>
          <div className="card-shine"></div>

          <Heading size="5" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '1.5rem' }}>
            Other Participants
          </Heading>

          <Flex direction="column" gap="2">
            {standings.slice(3).map((standing, index) => {
              const rank = index + 4;
              const isCurrentUser = standing.userId === currentUserId;

              return (
                <Card
                  key={standing.userId}
                  className="feature-card"
                  style={{
                    background: isCurrentUser
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                    border: isCurrentUser
                      ? '2px solid rgba(99, 102, 241, 0.6)'
                      : '1px solid rgba(99, 102, 241, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.875rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Flex align="center" gap="2">
                    <Badge size="2" style={{ background: getRankColor(rank), fontWeight: 700, minWidth: '32px', flexShrink: 0 }}>
                      #{rank}
                    </Badge>
                    <Avatar size="2" fallback={standing.name.charAt(0).toUpperCase()} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', flexShrink: 0 }} />
                    <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                      <Text size="2" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {standing.name}
                        {isCurrentUser && <Badge size="1" color="violet" variant="soft" style={{ marginLeft: '0.5rem' }}>You</Badge>}
                      </Text>
                    </Flex>
                    <Text size="3" weight="bold" style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', minWidth: '50px', textAlign: 'right', flexShrink: 0 }}>
                      {standing.score}
                    </Text>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        </Box>
        )}

        {/* Action Buttons */}
        <Flex justify="center" gap="4" mt="6" wrap="wrap">
          <Button
            size="3"
            variant="soft"
            color="gray"
            onClick={() => navigate('/')}
            style={{
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <HomeIcon />
            Back to Home
          </Button>

          <Button
            size="3"
            variant="soft"
            onClick={() => navigate(`/contest/${contestId}/summary`, { 
              state: { contestMeta, userScore: finalScore } 
            })}
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <CheckCircledIcon />
            View Summary
          </Button>

          <Button
            size="3"
            onClick={() => navigate('/create-contest')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <StarFilledIcon />
            Create New Contest
          </Button>
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
