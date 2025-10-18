import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, Badge } from '@radix-ui/themes';
import { HomeIcon, CheckCircledIcon, CrossCircledIcon, ClockIcon, StarIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import LoadingSpinner from './LoadingSpinner';
import '../App.css';

interface Question {
  _id: string;
  statement: string;
  options: string[];
  correctAnswer: string[];
  topic: string;
  week?: number;
}

interface UserAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
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

export default function ContestSummary() {
  const navigate = useNavigate();
  const { contestId } = useParams<{ contestId: string }>();
  const location = useLocation();
  const contestMeta = location.state?.contestMeta as ContestMeta;
  const userScore = location.state?.userScore as number;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [unanswered, setUnanswered] = useState(0);

  useEffect(() => {
    fetchContestSummary();
  }, [contestId]);

  const fetchContestSummary = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(
        `http://localhost:10000/api/contest/${contestId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Contest summary response:', response.data);
      
      if (response.data.success) {
        setQuestions(response.data.questions || []);
        setUserAnswers(response.data.userAnswers || []);
        
        const total = (response.data.questions || []).length;
        const correct = (response.data.userAnswers || []).filter((a: UserAnswer) => a.isCorrect).length;
        const wrong = (response.data.userAnswers || []).filter((a: UserAnswer) => !a.isCorrect && (Array.isArray(a.answer) ? a.answer.length > 0 : a.answer)).length;
        const unansweredCount = total - correct - wrong;

        setTotalQuestions(total);
        setCorrectAnswers(correct);
        setWrongAnswers(wrong);
        setUnanswered(unansweredCount);
      } else {
        console.error('API returned success: false', response.data);
      }
    } catch (error) {
      console.error('Error fetching contest summary:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const normalizeAnswer = (answer: string | string[]): string[] => {
    if (Array.isArray(answer)) {
      return answer.sort();
    }
    return answer ? [answer] : [];
  };

  if (loading) {
    return <LoadingSpinner message="Loading contest summary..." />;
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
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Container size="3" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="6" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Flex direction="column" gap="5">
          {/* Header */}
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Heading size="8" className="glow-text-enhanced" style={{
              letterSpacing: '-0.02em',
              fontWeight: 800,
              fontFamily: 'Poppins, sans-serif',
            }}>
              <StarIcon style={{ display: 'inline', marginRight: '0.5rem' }} />
              Contest Summary
            </Heading>
            <Flex gap="2">
              <Button 
                onClick={() => navigate(`/contest/${contestId}/standings`, { state: { contestMeta } })}
                variant="soft"
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                View Standings
              </Button>
              <Button 
                variant="soft" 
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                <HomeIcon /> Home
              </Button>
            </Flex>
          </Flex>

          {/* Contest Info Card */}
          {contestMeta && (
            <Card className="hero-card" style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(99, 102, 241, 0.4)',
              padding: '2rem',
            }}>
              <Flex direction="column" gap="3">
                <Flex gap="3" align="center" wrap="wrap">
                  <Badge size="2" color="violet" variant="soft">
                    Contest: {contestMeta.code}
                  </Badge>
                  <Badge size="2" color="blue" variant="soft">
                    {contestMeta.mode}
                  </Badge>
                </Flex>
                
                {userScore !== undefined && (
                  <Flex gap="6" style={{ marginTop: '1rem' }} wrap="wrap">
                    <Flex direction="column" gap="1">
                      <Text size="7" weight="bold" style={{
                        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'block',
                      }}>
                        {userScore}
                      </Text>
                      <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', display: 'block' }}>
                        Your Score
                      </Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="7" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', display: 'block' }}>
                        {correctAnswers}/{totalQuestions}
                      </Text>
                      <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', display: 'block' }}>
                        Correct
                      </Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="7" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', display: 'block' }}>
                        {Math.round((correctAnswers / totalQuestions) * 100)}%
                      </Text>
                      <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', display: 'block' }}>
                        Accuracy
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Flex>
            </Card>
          )}

          {/* Stats Grid */}
          <Flex gap="3" wrap="wrap" justify="center">
            <Card className="feature-card" style={{
              background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem',
              minWidth: '150px',
            }}>
              <Flex direction="column" align="center" gap="2">
                <CheckCircledIcon width={32} height={32} color="rgb(34, 197, 94)" />
                <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                  {correctAnswers}
                </Text>
                <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Correct</Text>
              </Flex>
            </Card>
            <Card className="feature-card" style={{
              background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem',
              minWidth: '150px',
            }}>
              <Flex direction="column" align="center" gap="2">
                <CrossCircledIcon width={32} height={32} color="rgb(239, 68, 68)" />
                <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                  {wrongAnswers}
                </Text>
                <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Wrong</Text>
              </Flex>
            </Card>
            <Card className="feature-card" style={{
              background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem',
              minWidth: '150px',
            }}>
              <Flex direction="column" align="center" gap="2">
                <ClockIcon width={32} height={32} color="rgb(251, 146, 60)" />
                <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                  {unanswered}
                </Text>
                <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Unanswered</Text>
              </Flex>
            </Card>
          </Flex>

          {/* Question-wise Analysis */}
          <Heading size="5" style={{ color: 'rgba(226, 232, 240, 0.95)', marginTop: '1rem' }}>
            Question-wise Analysis
          </Heading>
          <Flex direction="column" gap="3">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find(a => a.questionId === question._id);
              const userAnswerNormalized = userAnswer ? normalizeAnswer(userAnswer.answer) : [];
              const correctAnswerNormalized = question.correctAnswer.sort();
              const isCorrect = userAnswer?.isCorrect || false;
              const isAnswered = userAnswerNormalized.length > 0;

              return (
                <Card key={question._id} className="feature-card" style={{ 
                  background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                  border: `1.5px solid ${isCorrect ? 'rgba(34, 197, 94, 0.4)' : isAnswered ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 146, 60, 0.4)'}`,
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem',
                }}>
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="start" gap="3">
                      <Text weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', flex: 1 }}>
                        Q{index + 1}. {question.statement}
                      </Text>
                      <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
                        {isCorrect ? (
                          <Badge color="green" variant="soft">
                            <CheckCircledIcon /> Correct
                          </Badge>
                        ) : isAnswered ? (
                          <Badge color="red" variant="soft">
                            <CrossCircledIcon /> Wrong
                          </Badge>
                        ) : (
                          <Badge color="orange" variant="soft">
                            <ClockIcon /> Skipped
                          </Badge>
                        )}
                      </Flex>
                    </Flex>
                    
                    {/* Options */}
                    <Flex direction="column" gap="2">
                      {question.options.map((option, optIndex) => {
                        const isCorrectOption = correctAnswerNormalized.includes(option);
                        const isUserSelected = userAnswerNormalized.includes(option);
                        
                        return (
                          <Box key={optIndex} style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: isCorrectOption 
                              ? 'rgba(34, 197, 94, 0.15)' 
                              : isUserSelected 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : 'rgba(15, 23, 42, 0.5)',
                            border: `1px solid ${isCorrectOption ? 'rgba(34, 197, 94, 0.4)' : isUserSelected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'}`,
                          }}>
                            <Flex gap="2" align="center">
                              <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.95)', flex: 1 }}>
                                {option}
                              </Text>
                              {isCorrectOption && (
                                <Badge size="1" color="green" variant="soft">
                                  <CheckCircledIcon /> Correct Answer
                                </Badge>
                              )}
                              {isUserSelected && !isCorrectOption && (
                                <Badge size="1" color="red" variant="soft">
                                  <CrossCircledIcon /> Your Answer
                                </Badge>
                              )}
                              {isUserSelected && isCorrectOption && (
                                <Badge size="1" color="green" variant="soft">
                                  Your Answer
                                </Badge>
                              )}
                            </Flex>
                          </Box>
                        );
                      })}
                    </Flex>
                    
                    {/* Topic/Week Badge */}
                    <Flex gap="2">
                      {question.topic && (
                        <Badge size="1" color="cyan" variant="soft" style={{ width: 'fit-content' }}>
                          {question.topic}
                        </Badge>
                      )}
                      {question.week && (
                        <Badge size="1" color="purple" variant="soft" style={{ width: 'fit-content' }}>
                          Week {question.week}
                        </Badge>
                      )}
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
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
