import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, Badge, Avatar } from '@radix-ui/themes';
import { HomeIcon, StarFilledIcon, CheckCircledIcon, StarIcon } from '@radix-ui/react-icons';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import LoadingSpinner from './LoadingSpinner';
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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [contestInfo, setContestInfo] = useState<{ isLive: boolean; totalParticipants: number; capacity: number } | null>(null);

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
    const token = Cookies.get('authToken');
    if (!token) {
      navigate('/');
      return;
    }

    // Get current user ID from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);
    } catch (err) {
      // Silently handle token error
    }

    // Initialize socket connection
    const socketInstance = io('http://localhost:10000', {
      auth: { token },
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
        const response = await fetch(`http://localhost:10000/api/contest/${contestId}/questions`);
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

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

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

        {/* Top 3 Podium */}
        {standings.length >= 3 && (
          <Flex justify="center" align="end" gap="4" mb="6" wrap="wrap">
            {/* 2nd Place */}
            <Box className="hero-card" style={{
              width: '200px',
              background: 'rgba(148, 163, 184, 0.15)',
              borderRadius: '1.5rem',
              boxShadow: '0 8px 32px 0 rgba(148, 163, 184, 0.3)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(148, 163, 184, 0.4)',
              padding: '1.5rem',
              textAlign: 'center',
              animation: 'scaleIn 0.5s ease-out 0.2s both',
            }}>
              <Text size="6" style={{ marginBottom: '0.5rem' }}>{getMedalEmoji(2)}</Text>
              <Avatar
                size="5"
                fallback={standings[1].name.charAt(0).toUpperCase()}
                style={{
                  background: getRankColor(2),
                  margin: '0 auto 1rem',
                }}
              />
              <Text size="3" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem' }}>
                {standings[1].name}
              </Text>
              <Badge size="2" color="gray" variant="soft">
                {standings[1].score} points
              </Badge>
            </Box>

            {/* 1st Place */}
            <Box className="hero-card" style={{
              width: '220px',
              background: 'rgba(251, 191, 36, 0.15)',
              borderRadius: '1.5rem',
              boxShadow: '0 12px 48px 0 rgba(251, 191, 36, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(251, 191, 36, 0.6)',
              padding: '2rem',
              textAlign: 'center',
              animation: 'scaleIn 0.5s ease-out both',
              position: 'relative',
            }}>
              <div className="card-shine"></div>
              <Text size="8" style={{ marginBottom: '0.5rem' }}>{getMedalEmoji(1)}</Text>
              <Avatar
                size="6"
                fallback={standings[0].name.charAt(0).toUpperCase()}
                style={{
                  background: getRankColor(1),
                  margin: '0 auto 1rem',
                  boxShadow: '0 8px 24px rgba(251, 191, 36, 0.5)',
                }}
              />
              <Text size="4" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem' }}>
                {standings[0].name}
              </Text>
              <Badge size="2" style={{ background: getRankColor(1) }}>
                <StarFilledIcon />
                {standings[0].score} points
              </Badge>
            </Box>

            {/* 3rd Place */}
            <Box className="hero-card" style={{
              width: '200px',
              background: 'rgba(217, 119, 6, 0.15)',
              borderRadius: '1.5rem',
              boxShadow: '0 8px 32px 0 rgba(217, 119, 6, 0.3)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(217, 119, 6, 0.4)',
              padding: '1.5rem',
              textAlign: 'center',
              animation: 'scaleIn 0.5s ease-out 0.4s both',
            }}>
              <Text size="6" style={{ marginBottom: '0.5rem' }}>{getMedalEmoji(3)}</Text>
              <Avatar
                size="5"
                fallback={standings[2].name.charAt(0).toUpperCase()}
                style={{
                  background: getRankColor(3),
                  margin: '0 auto 1rem',
                }}
              />
              <Text size="3" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem' }}>
                {standings[2].name}
              </Text>
              <Badge size="2" color="orange" variant="soft">
                {standings[2].score} points
              </Badge>
            </Box>
          </Flex>
        )}

        {/* Full Standings List */}
        <Box className="hero-card" style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(35, 54, 85, 0.35)',
          borderRadius: '2rem',
          boxShadow: '0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(49, 84, 130, 0.4)',
          padding: '2rem',
          position: 'relative',
        }}>
          <div className="card-shine"></div>

          <Heading size="5" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '1.5rem' }}>
            All Participants
          </Heading>

          <Flex direction="column" gap="3">
            {standings.map((standing, index) => {
              const rank = index + 1;
              const isCurrentUser = standing.userId === currentUserId;

              return (
                <Card
                  key={standing.userId}
                  className="feature-card"
                  style={{
                    background: isCurrentUser
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                      : rank <= 3
                      ? 'linear-gradient(135deg, rgba(15, 29, 49, 0.9) 0%, rgba(20, 35, 60, 0.7) 100%)'
                      : 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                    border: isCurrentUser
                      ? '2px solid rgba(99, 102, 241, 0.6)'
                      : '1px solid rgba(99, 102, 241, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '1.25rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Flex align="center" gap="4">
                    {/* Rank */}
                    <Box style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: getRankColor(rank),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: rank <= 3 ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
                    }}>
                      {rank <= 3 ? getMedalEmoji(rank) : rank}
                    </Box>

                    {/* Avatar */}
                    <Avatar
                      size="4"
                      fallback={standing.name.charAt(0).toUpperCase()}
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      }}
                    />

                    {/* Name */}
                    <Flex direction="column" style={{ flex: 1 }}>
                      <Text size="4" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                        {standing.name}
                        {isCurrentUser && (
                          <Badge size="1" color="violet" variant="soft" style={{ marginLeft: '0.5rem' }}>
                            You
                          </Badge>
                        )}
                      </Text>
                      <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.7)' }}>
                        Rank #{rank}
                      </Text>
                    </Flex>

                    {/* Score */}
                    <Box style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      borderRadius: '1rem',
                      padding: '0.75rem 1.5rem',
                      textAlign: 'center',
                    }}>
                      <Text size="5" weight="bold" style={{
                        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {standing.score}
                      </Text>
                      <Text size="1" style={{ color: 'rgba(148, 163, 184, 0.7)', display: 'block' }}>
                        points
                      </Text>
                    </Box>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        </Box>

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
