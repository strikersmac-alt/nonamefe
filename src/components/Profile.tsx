import { Box, Flex, Heading, Text, Card, Grid, Container, Badge, Avatar, Button } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  PersonIcon, 
  CalendarIcon, 
  RocketIcon, 
  StarFilledIcon, 
  CheckCircledIcon,
  CrossCircledIcon,
  BarChartIcon,
  ActivityLogIcon,
  BadgeIcon,
  LightningBoltIcon,
  ReaderIcon,
  GlobeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExitIcon
} from '@radix-ui/react-icons';
import LoadingSpinner from './LoadingSpinner';
import '../App.css';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface ContestHistory {
  contestId: string;
  code: string;
  mode: string;
  isLive: boolean;
  duration: number;
  startTime: string;
  createdAt: string;
  userScore: number;
  totalQuestions: number;
  rank: number;
  totalParticipants: number;
}

interface Insights {
  totalContests: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  averageScore: number;
  accuracyRate: number;
  bestRank: number | null;
  contestsByMode: {
    duel: number;
    practice: number;
    multiplayer: number;
  };
  recentActivity: Array<{
    contestCode: string;
    mode: string;
    score: number;
    totalQuestions: number;
    rank: number;
    date: string;
  }>;
}

interface ProfileData {
  name: string;
  email: string;
  profilePicture: string;
  memberSince: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [contestHistory, setContestHistory] = useState<ContestHistory[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContests, setTotalContests] = useState(0);
  const contestsPerPage = 10;
  useDocumentTitle("MindMuse - Profile");
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchProfile = async (page = 1) => {
      setLoading(true);
      try {
        // const token = Cookies.get('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile?page=${page}&limit=${contestsPerPage}`, {
          method: 'GET',
          headers: {
            // 'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setContestHistory(data.contestHistory || []);
          setInsights(data.insights);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalContests(data.pagination?.totalContests || 0);
          setCurrentPage(data.pagination?.currentPage || 1);
        } else {
          setError(data.message || 'Failed to load profile');
        }
      } catch (err) {
        setError('Unable to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile(currentPage);
  }, [user, navigate, currentPage]);

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'duel':
        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'practice':
        return 'linear-gradient(90deg,rgba(42, 155, 102, 1) 0%, rgba(42, 155, 102, 1) 50%, rgba(42, 155, 102, 1) 100%)';
      case 'multiplayer':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      default:
        return 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'duel':
        return <LightningBoltIcon width={20} height={20} />;
      case 'practice':
        return <ReaderIcon width={20} height={20} />;
      case 'multiplayer':
        return <GlobeIcon width={20} height={20} />;
      default:
        return <RocketIcon width={20} height={20} />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error) {
    return (
      <Box style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <Text size="5" style={{ color: '#f87171' }}>{error}</Text>
        <Text 
          size="3" 
          style={{ color: '#60a5fa', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Return to Home
        </Text>
      </Box>
    );
  }

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
      <Container size="4" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="6" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header with Logout */}
        <Flex justify="between" align="center" mb="6">
          <Heading size="8" className="glow-text-enhanced" style={{ fontWeight: 800 }}>
            Profile
          </Heading>
          <Box
            onClick={async () => {
              try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
                  method: 'POST',
                  credentials: 'include',
                });
                logout();
                navigate('/');
              } catch (error) {
                // Silently handle logout error
              }
            }}
            style={{
              cursor: 'pointer',
              padding: '0.75rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <Flex align="center" gap="2">
              <ExitIcon width={18} height={18} style={{ color: '#f87171' }} />
              <Text size="3" weight="medium" style={{ color: '#f87171' }}>
                Logout
              </Text>
            </Flex>
          </Box>
        </Flex>

        {/* Profile Card */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
          boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          borderRadius: '1.8rem',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <Flex gap="4" align="center" direction={{ initial: 'column', sm: 'row' }}>
            <Avatar
              size="8"
              src={profile?.profilePicture}
              fallback={<PersonIcon width={48} height={48} />}
              style={{
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                border: '3px solid rgba(99, 102, 241, 0.3)',
              }}
            />
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
              <Heading size="6" style={{
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}>
                {profile?.name}
              </Heading>
              <Text size="3" style={{ color: 'rgba(226, 232, 240, 0.95)', fontWeight: 500 }}>
                {profile?.email}
              </Text>
              <Flex align="center" gap="2" mt="1">
                <CalendarIcon width={16} height={16} style={{ color: 'rgba(226, 232, 240, 0.85)' }} />
                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.85)' }}>
                  Member since {new Date(profile?.memberSince || '').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {/* Insights Section */}
        {insights && (
          <>
            <Heading size="6" mb="4" style={{
              color: '#e2e8f0',
              fontWeight: 700,
            }}>
              <Flex align="center" gap="2">
                <BarChartIcon width={24} height={24} />
                Performance Insights
              </Flex>
            </Heading>

            <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4" mb="6">
              <Card style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '1.2rem',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}>
                <Flex direction="column" gap="2">
                  <RocketIcon width={24} height={24} style={{ color: '#a78bfa' }} />
                  <Text size="7" weight="bold" style={{
                    background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {insights.totalContests}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500 }}>
                    Total Contests
                  </Text>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '1.2rem',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}>
                <Flex direction="column" gap="2">
                  <CheckCircledIcon width={24} height={24} style={{ color: '#60a5fa' }} />
                  <Text size="7" weight="bold" style={{
                    background: 'linear-gradient(135deg, #60a5fa, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {insights.accuracyRate.toFixed(1)}%
                  </Text>
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500 }}>
                    Accuracy Rate
                  </Text>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(251, 113, 133, 0.15) 100%)',
                border: '1px solid rgba(244, 114, 182, 0.3)',
                borderRadius: '1.2rem',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}>
                <Flex direction="column" gap="2">
                  <BadgeIcon width={24} height={24} style={{ color: '#f472b6' }} />
                  <Text size="7" weight="bold" style={{
                    background: 'linear-gradient(135deg, #f472b6, #fb7185)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {insights.bestRank ? `#${insights.bestRank}` : 'N/A'}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500 }}>
                    Best Rank
                  </Text>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.15) 0%, rgba(0, 242, 254, 0.15) 100%)',
                border: '1px solid rgba(79, 172, 254, 0.3)',
                borderRadius: '1.2rem',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}>
                <Flex direction="column" gap="2">
                  <StarFilledIcon width={24} height={24} style={{ color: '#4facfe' }} />
                  <Text size="7" weight="bold" style={{
                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {insights.totalCorrectAnswers}/{insights.totalQuestionsAttempted}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500 }}>
                    Correct Answers
                  </Text>
                </Flex>
              </Card>
            </Grid>

            {/* Contest Breakdown by Mode */}
            <Card style={{
              background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
              boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.4)',
              borderRadius: '1.8rem',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              padding: '2rem',
              marginBottom: '2rem',
            }}>
              <Heading size="5" mb="4" style={{ color: '#e2e8f0', fontWeight: 700 }}>
                Contests by Mode
              </Heading>
              <Grid columns={{ initial: '1', sm: '3' }} gap="4">
                {Object.entries(insights.contestsByMode).map(([mode, count]) => (
                  <Flex key={mode} align="center" gap="3" style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}>
                    <Box style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: getModeColor(mode),
                      borderRadius: '0.75rem',
                      color: 'white',
                    }}>
                      {getModeIcon(mode)}
                    </Box>
                    <Flex direction="column">
                      <Text size="5" weight="bold" style={{ color: '#e2e8f0' }}>
                        {count}
                      </Text>
                      <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.85)', textTransform: 'capitalize', fontWeight: 500 }}>
                        {mode}
                      </Text>
                    </Flex>
                  </Flex>
                ))}
              </Grid>
            </Card>
          </>
        )}

        {/* Contest History */}
        <Heading size="6" mb="4" style={{
          color: '#e2e8f0',
          fontWeight: 700,
        }}>
          <Flex align="center" gap="2">
            <ActivityLogIcon width={24} height={24} />
            Contest History
          </Flex>
        </Heading>

        {totalContests > 0 && (
          <Text size="2" mb="3" style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
            Showing {((currentPage - 1) * contestsPerPage) + 1} - {Math.min(currentPage * contestsPerPage, totalContests)} of {totalContests} contests
          </Text>
        )}

        {contestHistory.length === 0 ? (
          <Card style={{
            background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
            borderRadius: '1.8rem',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <CrossCircledIcon width={48} height={48} style={{ color: 'rgba(226, 232, 240, 0.6)', margin: '0 auto 1rem' }} />
            <Text size="4" style={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500 }}>
              No contest history yet. Join your first contest to get started!
            </Text>
          </Card>
        ) : (
          <Grid columns={{ initial: '1' }} gap="4">
            {contestHistory.map((contest) => (
              <Card key={contest.contestId} style={{
                background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.4)',
                borderRadius: '1.8rem',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/contest/${contest.contestId}/standings`, { 
                state: { fromProfile: true } 
              })}
              >
                <Flex justify="between" align="start" gap="4" direction={{ initial: 'column', sm: 'row' }}>
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                      <Badge size="2" color="gray" style={{ background: getModeColor(contest.mode), display: 'flex', alignItems: 'center', gap: '0.25rem'  }}>
                        {getModeIcon(contest.mode)} {contest.mode.toUpperCase()}
                      </Badge>
                      {contest.isLive && (
                        <Badge size="2" color="green">
                          🔴 LIVE
                        </Badge>
                      )}
                    </Flex>
                    <Heading size="5" style={{
                      color: '#60a5fa',
                      fontWeight: 700,
                    }}>
                      Contest #{contest.code}
                    </Heading>
                    <Text size="2" style={{ color: '#e2e8f0', fontWeight: 500 }}>
                      {new Date(contest.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} · {contest.duration} minutes
                    </Text>
                  </Flex>

                  <Box style={{ width: '1px', height: '80px', background: 'rgba(99, 102, 241, 0.2)', display: 'none' }} className="separator-desktop" />

                  <Grid columns="3" gap="4" style={{ minWidth: '300px' }}>
                    <Flex direction="column" align="center" gap="1">
                      <Text size="6" weight="bold" style={{
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        #{contest.rank}
                      </Text>
                      <Text size="1" style={{ color: 'rgba(226, 232, 240, 0.8)' }}>
                        Rank
                      </Text>
                    </Flex>
                    <Flex direction="column" align="center" gap="1">
                      <Text size="6" weight="bold" style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {contest.userScore}/{contest.totalQuestions}
                      </Text>
                      <Text size="1" style={{ color: 'rgba(226, 232, 240, 0.8)' }}>
                        Score
                      </Text>
                    </Flex>
                    <Flex direction="column" align="center" gap="1">
                      <Text size="6" weight="bold" style={{
                        background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {Math.round((contest.userScore / contest.totalQuestions) * 100)}%
                      </Text>
                      <Text size="1" style={{ color: 'rgba(226, 232, 240, 0.8)' }}>
                        Accuracy
                      </Text>
                    </Flex>
                  </Grid>
                </Flex>
              </Card>
            ))}
          </Grid>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Flex justify="center" align="center" gap="3" mt="6">
            <Button
              size="3"
              variant="soft"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeftIcon />
              Previous
            </Button>

            <Flex gap="2" align="center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    size="2"
                    variant={currentPage === pageNum ? 'solid' : 'soft'}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      minWidth: '40px',
                      cursor: 'pointer',
                      background: currentPage === pageNum
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </Flex>

            <Button
              size="3"
              variant="soft"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </Flex>
        )}
      </Container>
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
