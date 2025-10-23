import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, Badge, Progress, AlertDialog } from '@radix-ui/themes';
import { CheckCircledIcon, ClockIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import '../App.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useDocumentTitle from '../hooks/useDocumentTitle';


interface Question {
  _id: string;
  statement: string;
  options: string[];
  topic: string;
  week?: number;
  correctAnswerCount?: number; // Number of correct answers (1 = radio, >1 = checkbox)
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

interface AnswerResult {
  questionId: string;
  isCorrect: boolean;
  selectedAnswer: string | string[];
}

export default function ContestPlay() {
  const navigate = useNavigate();
  const { contestId } = useParams<{ contestId: string }>();
  const location = useLocation();
  const initialContestMeta = location.state?.contestMeta as ContestMeta;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [contestEnded, setContestEnded] = useState(false);
  const [score, setScore] = useState(0);
  const [currentAnswerResult, setCurrentAnswerResult] = useState<AnswerResult | null>(null);
  const [showEndTestModal, setShowEndTestModal] = useState(false);
  const [contestMeta, setContestMeta] = useState<ContestMeta | null>(initialContestMeta || null);

  useDocumentTitle("MindMuse - Contest");

  useEffect(() => {
    if (currentAnswerResult) {
      if (currentAnswerResult.isCorrect) {
        toast.success('Correct!', {
          position: 'top-right',
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          style: {
            color: 'white',
            borderRadius: '0.75rem',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            backdropFilter: 'blur(10px)',
            background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
            fontWeight: '600',
          },
        });
      } else {
        toast.error('Incorrect', {
          position: 'top-right',
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          style: {
            color: 'white',
            borderRadius: '0.75rem',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            backdropFilter: 'blur(10px)',
            background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
            fontWeight: '600',
          },
        });
      }
    }
  }, [currentAnswerResult]);

  // Check if contest is already completed
  useEffect(() => {
    const completedContests = JSON.parse(localStorage.getItem('completedContests') || '[]');
    if (completedContests.includes(contestId)) {
      // Contest already completed, redirect to standings
      navigate(`/contest/${contestId}/standings`, { 
        state: { contestMeta },
        replace: true
      });
    }
  }, [contestId, navigate, contestMeta]);

  // Prevent browser back button after entering contest
  useEffect(() => {
    // Replace current history entry to prevent going back
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      // Push state again to prevent back navigation
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch questions + progress
  useEffect(() => {
    const fetchQuestionsAndProgress = async () => {
      try {
        const questionsResponse = await axios.get<{ success: boolean; questions: Question[]; meta: ContestMeta }>(
          `${import.meta.env.VITE_API_URL}/api/contest/${contestId}/questions`
        );
        
        if (questionsResponse.data.success) {
          setQuestions(questionsResponse.data.questions);
          if (questionsResponse.data.meta) {
            setContestMeta(questionsResponse.data.meta);
          }
          
          try {
            const summaryResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/contest/${contestId}/summary`,
              { withCredentials: true }
            );
            
            if (summaryResponse.data.success) {
              const userAnswers = summaryResponse.data.userAnswers || [];
              
              if (userAnswers.length > 0) {
                const restoredAnswers: AnswerResult[] = userAnswers.map((ua: any) => ({
                  questionId: ua.questionId,
                  isCorrect: ua.isCorrect,
                  selectedAnswer: ua.answer
                }));
                
                setAnswers(restoredAnswers);
                
                const previousScore = userAnswers.filter((ua: any) => ua.isCorrect).length;
                setScore(previousScore);
                
                const answeredQuestionIds = new Set(userAnswers.map((ua: any) => ua.questionId));
                const firstUnansweredIndex = questionsResponse.data.questions.findIndex(
                  (q: Question) => !answeredQuestionIds.has(String(q._id))
                );
                
                if (firstUnansweredIndex !== -1) {
                  setCurrentQuestionIndex(firstUnansweredIndex);
                  console.log(`Resuming from question ${firstUnansweredIndex + 1} with score ${previousScore}`);
                } else {
                  const completedContests = JSON.parse(localStorage.getItem('completedContests') || '[]');
                  if (!completedContests.includes(contestId)) {
                    completedContests.push(contestId);
                    localStorage.setItem('completedContests', JSON.stringify(completedContests));
                  }
                  navigate(`/contest/${contestId}/standings`, { 
                    state: { contestMeta, finalScore: previousScore },
                    replace: true
                  });
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching previous progress:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionsAndProgress();
  }, [contestId, navigate]);

  // Initialize socket and timer
  useEffect(() => {
    const socketInstance = io(`${import.meta.env.VITE_API_URL}`, {
      withCredentials: true,
    });

    setSocket(socketInstance);

    socketInstance.on('contestEnded', () => {
      setContestEnded(true);
      
      // Mark contest as completed
      const completedContests = JSON.parse(localStorage.getItem('completedContests') || '[]');
      if (!completedContests.includes(contestId)) {
        completedContests.push(contestId);
        localStorage.setItem('completedContests', JSON.stringify(completedContests));
      }
      
      setTimeout(() => {
        navigate(`/contest/${contestId}/standings`, { 
          state: { contestMeta, finalScore: score },
          replace: true
        });
      }, 2000);
    });

    socketInstance.on('updateStandings', () => {
      // Standings updated in real-time
    });

    // Calculate time remaining
    if (contestMeta) {
      const startTime = parseInt(contestMeta.startTime);
      const duration = contestMeta.duration * 60 * 1000; // Convert to milliseconds
      const endTime = startTime + duration;
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setContestEnded(true);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => {
        clearInterval(interval);
        socketInstance.disconnect();
      };
    }

    return () => {
      socketInstance.disconnect();
    };
  }, [contestId, contestMeta, navigate, score]);

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isMultiSelect = (currentQuestion.correctAnswerCount || 1) > 1;
    
    if (isMultiSelect) {
      // Checkbox behavior - allow multiple selections
      if (selectedAnswers.includes(answer)) {
        setSelectedAnswers(selectedAnswers.filter(a => a !== answer));
      } else {
        setSelectedAnswers([...selectedAnswers, answer]);
      }
    } else {
      // Radio behavior - only one selection
      setSelectedAnswers([answer]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswers.length === 0 || submitting || !socket) return;

    setSubmitting(true);
    setCurrentAnswerResult(null); // Clear previous result
    const currentQuestion = questions[currentQuestionIndex];

    try {
      // Submit answer via socket and get validation response
      // Send as array if multiple, or single string if one
      const answerToSubmit = selectedAnswers.length === 1 ? selectedAnswers[0] : selectedAnswers;
      
      socket.emit('submitAnswer', {
        contestId,
        questionId: currentQuestion._id,
        answer: answerToSubmit,
      }, (response: any) => {
        if (!response.success) {
          setSubmitting(false);
          return;
        }

        const isCorrect = response.isCorrect;
        
        // Store answer result
        const answerResult: AnswerResult = {
          questionId: currentQuestion._id,
          isCorrect,
          selectedAnswer: answerToSubmit,
        };
        
        // Set current answer result for immediate feedback
        setCurrentAnswerResult(answerResult);
        setAnswers([...answers, answerResult]);
        
        if (isCorrect) {
          setScore(score + 1);
        }

        // Move to next question after a short delay
        setTimeout(() => {
          setCurrentAnswerResult(null); // Clear feedback
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswers([]); // Reset selection for next question
          } else {
            // All questions answered, mark contest as completed and go to standings
            const completedContests = JSON.parse(localStorage.getItem('completedContests') || '[]');
            if (!completedContests.includes(contestId)) {
              completedContests.push(contestId);
              localStorage.setItem('completedContests', JSON.stringify(completedContests));
            }
            
            navigate(`/contest/${contestId}/standings`, { 
              state: { contestMeta, finalScore: score + (isCorrect ? 1 : 0) },
              replace: true
            });
          }
          setSubmitting(false);
        }, 500);
      });
    } catch (error) {
      setSubmitting(false);
    }
  };

  const handleEndTest = async () => {
    if (!socket) return;

    // Submit dummy answers for all remaining unanswered questions
    // This ensures the backend marks the user as "completed"
    const answeredQuestionIds = new Set(answers.map(a => a.questionId));
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q._id));

    // Submit empty/wrong answers for remaining questions
    for (const question of unansweredQuestions) {
      await new Promise<void>((resolve) => {
        socket.emit('submitAnswer', {
          contestId,
          questionId: question._id,
          answer: '', // Empty answer (will be marked as wrong)
        }, () => {
          resolve();
        });
      });
    }

    // Mark contest as completed in localStorage
    const completedContests = JSON.parse(localStorage.getItem('completedContests') || '[]');
    if (!completedContests.includes(contestId)) {
      completedContests.push(contestId);
      localStorage.setItem('completedContests', JSON.stringify(completedContests));
    }
    
    // Navigate to standings
    navigate(`/contest/${contestId}/standings`, { 
      state: { contestMeta, finalScore: score },
      replace: true
    });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading questions..." />;
  }

  if (contestEnded) {
    return (
      <Box style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '70px',
      }}>
        <Card style={{
          background: 'rgba(35, 54, 85, 0.35)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(49, 84, 130, 0.4)',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <Heading size="6" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '1rem' }}>
            Contest Ended!
          </Heading>
          <Text size="3" style={{ color: 'rgba(226, 232, 240, 0.8)' }}>
            Redirecting to standings...
          </Text>
        </Card>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timePercentage = contestMeta ? (timeRemaining / (contestMeta.duration * 60 * 1000)) * 100 : 100;

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

      <Container size="3" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="4" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        
        {/* Header with Timer and Progress */}
        <Flex direction="column" gap="3" mb="4">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Badge size="2" color="violet" variant="soft" style={{ backdropFilter: 'blur(10px)' }}>
              <LightningBoltIcon />
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>

            <Flex align="center" gap="2">
              <Badge 
                size="2" 
                color={timePercentage > 30 ? 'green' : timePercentage > 10 ? 'orange' : 'red'} 
                variant="soft"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ClockIcon />
                {formatTime(timeRemaining)}
              </Badge>

              <AlertDialog.Root open={showEndTestModal} onOpenChange={setShowEndTestModal}>
                <AlertDialog.Trigger>
                  <Button
                    size="1"
                    color="red"
                    variant="soft"
                    style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    End Test
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content style={{ 
                  maxWidth: 450,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '1rem',
                }}>
                  <AlertDialog.Title style={{ color: 'rgba(226, 232, 240, 0.95)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    End Test Early?
                  </AlertDialog.Title>
                  <AlertDialog.Description size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                    Are you sure you want to end the test? You have answered {answers.length} out of {questions.length} questions. 
                    Your current score is {score}. This action cannot be undone.
                  </AlertDialog.Description>

                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button 
                        variant="soft" 
                        style={{
                          background: 'rgba(100, 100, 100, 0.3)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: 'rgba(226, 232, 240, 0.9)',
                        }}
                      >
                        Cancel
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button 
                        onClick={handleEndTest}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      >
                        Yes, End Test
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </Flex>

            <Badge size="2" color="blue" variant="soft" style={{ backdropFilter: 'blur(10px)' }}>
              Score: {score}/{questions.length}
            </Badge>
          </Flex>

          <Progress 
            value={progress} 
            style={{ 
              height: '8px',
              background: 'rgba(15, 23, 42, 0.5)',
            }} 
          />
        </Flex>

        {/* Question Card */}
        <Box className="hero-card" style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(35, 54, 85, 0.35)',
          borderRadius: '1.5rem',
          boxShadow: '0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(49, 84, 130, 0.4)',
          padding: window.innerWidth < 768 ? '1.25rem' : '1.75rem',
          position: 'relative',
        }}>
          <div className="card-shine"></div>

          <Flex direction="column" gap="4">
            {/* Topic Badge */}
            <Badge size="2" color="cyan" variant="soft" style={{ width: 'fit-content' }}>
              {currentQuestion.topic}
            </Badge>

            {/* Question Statement */}
            <Heading size="5" style={{
              color: 'rgba(226, 232, 240, 0.95)',
              lineHeight: 1.5,
              fontFamily: 'Poppins, sans-serif',
            }}>
              {currentQuestion.statement}
            </Heading>

            {/* Selection Type Hint */}
            <Badge 
              size="1" 
              color={(currentQuestion.correctAnswerCount || 1) > 1 ? 'violet' : 'blue'} 
              variant="soft" 
              style={{ width: 'fit-content' }}
            >
              {(currentQuestion.correctAnswerCount || 1) > 1 ? 'Multiple answers possible' : 'Single answer only'}
            </Badge>

            {/* Answer Options */}
            <Flex direction="column" gap="2" mt="1">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers.includes(option);
                return (
                  <Card
                    key={index}
                    className="feature-card"
                    onClick={() => !submitting && handleAnswerSelect(option)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                      border: isSelected
                        ? '2px solid rgba(99, 102, 241, 0.6)'
                        : '1px solid rgba(99, 102, 241, 0.2)',
                      backdropFilter: 'blur(10px)',
                      padding: '1rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    <Flex align="center" gap="3">
                      <Box style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: (currentQuestion.correctAnswerCount || 1) > 1 ? '4px' : '50%', // Square for checkbox, circle for radio
                        border: isSelected ? '2px solid #667eea' : '2px solid rgba(99, 102, 241, 0.3)',
                        background: isSelected ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isSelected && <CheckCircledIcon color="white" width={16} height={16} />}
                      </Box>
                      <Text style={{ color: 'rgba(226, 232, 240, 0.95)', flex: 1 }}>{option}</Text>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>

            {/* Submit Button */}
            <Button
              size="3"
              disabled={selectedAnswers.length === 0 || submitting}
              onClick={handleSubmitAnswer}
              style={{
                marginTop: '0.5rem',
                background: selectedAnswers.length > 0 && !submitting
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(100, 100, 100, 0.3)',
                cursor: selectedAnswers.length > 0 && !submitting ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                boxShadow: selectedAnswers.length > 0 && !submitting ? '0 8px 24px rgba(102, 126, 234, 0.4)' : 'none',
              }}
            >
              {submitting ? (
                <>
                  <LightningBoltIcon />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircledIcon />
                  Submit Answer
                </>
              )}
            </Button>
          </Flex>
        </Box>
        {/* {submitting && currentAnswerResult && (
          <Card style={{
            maxWidth: '600px',
            margin: '1rem auto 0',
            background: currentAnswerResult.isCorrect
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: currentAnswerResult.isCorrect
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1rem',
            textAlign: 'center',
            animation: 'scaleIn 0.3s ease-out',
          }}>
            <Flex align="center" justify="center" gap="2">
              {currentAnswerResult.isCorrect ? (
                <>
                  <CheckCircledIcon width={20} height={20} color="#10b981" />
                  <Text size="3" weight="bold" style={{ color: '#10b981' }}>
                    Correct!
                  </Text>
                </>
              ) : (
                <>
                  <CrossCircledIcon width={20} height={20} color="#ef4444" />
                  <Text size="3" weight="bold" style={{ color: '#ef4444' }}>
                    Incorrect
                  </Text>
                </>
              )}
            </Flex>
          </Card>
        )} */}
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
          <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.7)', fontSize: '0.8rem' }}>
            MindMuse · Contest in Progress
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
