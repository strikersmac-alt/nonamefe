import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Card, Grid, Container, Button, Dialog, Badge, Progress, TextField, Switch } from '@radix-ui/themes';
import { BookmarkIcon, ClockIcon, CheckCircledIcon, CrossCircledIcon, ResetIcon, LightningBoltIcon, ChevronLeftIcon, ChevronRightIcon, ShuffleIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { createUserNptelAnalytics, createDailyUserAnalytics, createNptelPracticeAnalytics } from '../services/analyticsService';
import LoadingSpinner from './LoadingSpinner';
import '../App.css';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface Course {
  _id: string;
  name: string;
  code: string;
  durationInWeeks: number;
}

interface Question {
  _id: string;
  courseName: string;
  courseCode: string;
  ps: string;
  options: string[];
  correct: string[];
  week: number;
}

interface TestAnswer {
  questionId: string;
  selectedOptions: string[];
  isCorrect: boolean;
  timeTaken: number;
}

interface TestResult {
  courseCode: string;
  courseName: string;
  weeks: number[];
  duration: number;
  questions: Question[];
  answers: TestAnswer[];
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  totalTimeTaken: number;
  score: number;
  timestamp: number;
}

export default function Practice() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [duration, setDuration] = useState(30);
  const [showModal, setShowModal] = useState(false);
  const [questionLimit, setQuestionLimit] = useState<number>(0);
  const [availableQuestions, setAvailableQuestions] = useState<number>(0);
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [startingTest, setStartingTest] = useState(false);
  const [endingTest, setEndingTest] = useState(false);

  // Test state
  const [testActive, setTestActive] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimings, setQuestionTimings] = useState<Map<string, number>>(new Map());
  const [shuffledOptions, setShuffledOptions] = useState<Map<string, string[]>>(new Map());
  const navigate = useNavigate();
  // Analysis state
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  useDocumentTitle("MindMuse - Practice");
  
  useEffect(() => {
    if (location.pathname === '/practice' && showAnalysis) {
      setShowAnalysis(false);
      setTestResult(null);
      setTestActive(false);
      navigate('/practice');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Timer effect
  useEffect(() => {
    if (testActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTestEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testActive, timeRemaining]);

  useEffect(() => {

    const fetchQuestions = async () => {
      try {
        const newWeeks = selectedWeeks;
        if (newWeeks.length === 0) {
          setAvailableQuestions(0);
          return;
        }
        const weeksParam = newWeeks.join(',');
        const response = await axios.get<{ questions: Question[] }>(

          `${import.meta.env.VITE_API_URL}/api/nptel/questions/${selectedCourse?.code}?weeks=${weeksParam}`
        );
        setQuestions(response.data.questions);
        setAvailableQuestions(response.data.questions.length);
        // console.log("hello",response);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [selectedWeeks]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get<{ courses: Course[] }>(`${import.meta.env.VITE_API_URL}/api/course/courses`);
      setCourses(response.data.courses);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setSelectedWeeks([]);
    setDuration(30);
    setQuestionLimit(0);
    setAvailableQuestions(0);
    setShowModal(true);
  };

  const handleWeekToggle = async (week: number) => {
    const newWeeks = selectedWeeks.includes(week)
      ? selectedWeeks.filter(w => w !== week)
      : [...selectedWeeks, week];

    setSelectedWeeks(newWeeks);

    // Fetch available questions count for selected weeks
    if (newWeeks.length > 0 && selectedCourse) {
      try {
        const weeksParam = newWeeks.join(',');
        const response = await axios.get<{ questions: Question[] }>(
          `${import.meta.env.VITE_API_URL}/api/nptel/questions/${selectedCourse.code}?weeks=${weeksParam}`
        );
        const totalQuestions = response.data.questions.length;
        setAvailableQuestions(totalQuestions);
        setQuestionLimit(0); // Reset to "All" when weeks change
      } catch (error) {
        setAvailableQuestions(0);
      }
    } else {
      setAvailableQuestions(0);
      setQuestionLimit(0);
    }
  };

  const handleSelectAllWeeks = () => {
    if (!selectedCourse) return;
    const allWeeks = Array.from({ length: selectedCourse.durationInWeeks + 1 }, (_, i) => i);
    if (selectedWeeks.length === allWeeks.length) {
      setSelectedWeeks([]);


    } else {
      setSelectedWeeks(allWeeks);
    }
  };

  const handleStartTest = async () => {
    if (!selectedCourse || selectedWeeks.length === 0) return;
    setStartingTest(true);

    try {
      const weeksParam = selectedWeeks.join(',');
      const response = await axios.get<{ questions: Question[] }>(
        `${import.meta.env.VITE_API_URL}/api/nptel/questions/${selectedCourse.code}?weeks=${weeksParam}`
      );

      if (response.data.questions.length === 0) {
        setShowModal(false);
        return;
      }

      if (user?._id) {
        const timestamp = Date.now();
        try {
          await createUserNptelAnalytics(user._id, 1, 0);
          await createDailyUserAnalytics(user._id, timestamp, undefined, undefined, 1, 0);
          await createNptelPracticeAnalytics(selectedCourse.code, timestamp);
        } catch (analyticsError) {
          console.error('Analytics tracking failed:', analyticsError);
        }
      }

      // Always shuffle questions
      let processedQuestions = [...response.data.questions].sort(() => Math.random() - 0.5);

      // Apply question limit if set (0 means all questions)
      if (questionLimit > 0 && questionLimit < processedQuestions.length) {
        processedQuestions = processedQuestions.slice(0, questionLimit);
      }

      // Shuffle options for each question if enabled
      const optionsMap = new Map<string, string[]>();
      processedQuestions.forEach(question => {
        const shuffledOpts = shuffleEnabled
          ? [...question.options].sort(() => Math.random() - 0.5)
          : [...question.options];
        optionsMap.set(question._id, shuffledOpts);
      });

      setQuestions(processedQuestions);
      setShuffledOptions(optionsMap);
      setTestActive(true);
      setShowModal(false);
      setTimeRemaining(duration * 60);
      setCurrentQuestionIndex(0);
      setAnswers(new Map());
      setQuestionTimings(new Map());
      setQuestionStartTime(Date.now());
    } catch (error) {
      setShowModal(false);
    } finally {
      setStartingTest(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswers = answers.get(currentQuestion._id) || [];
    const isMultiSelect = currentQuestion.correct.length > 1;

    let newAnswers: string[];

    if (isMultiSelect) {
      // Checkbox behavior for multi-answer questions
      if (currentAnswers.includes(option)) {
        newAnswers = currentAnswers.filter(a => a !== option);
      } else {
        newAnswers = [...currentAnswers, option];
      }
    } else {
      // Radio behavior for single-answer questions
      newAnswers = [option];
    }

    const newAnswersMap = new Map(answers);
    newAnswersMap.set(currentQuestion._id, newAnswers);
    setAnswers(newAnswersMap);

    if (autoNextEnabled && !isMultiSelect) {
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    // Save timing for current question
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimings = new Map(questionTimings);
    newTimings.set(
      currentQuestion._id,
      (newTimings.get(currentQuestion._id) || 0) + timeTaken
    );
    setQuestionTimings(newTimings);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setQuestionStartTime(Date.now());
      }, 200);
    }
  };

  const handlePreviousQuestion = () => {
    // Save timing for current question
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimings = new Map(questionTimings);
    newTimings.set(currentQuestion._id, (newTimings.get(currentQuestion._id) || 0) + timeTaken);
    setQuestionTimings(newTimings);

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleTestEnd = async () => {
    setEndingTest(true);
    // Save timing for last question
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimings = new Map(questionTimings);
    newTimings.set(currentQuestion._id, (newTimings.get(currentQuestion._id) || 0) + timeTaken);

    // Calculate results
    const testAnswers: TestAnswer[] = questions.map(q => {
      const selectedOptions = answers.get(q._id) || [];
      const correctSorted = [...q.correct].sort();
      const selectedSorted = [...selectedOptions].sort();
      const isCorrect = JSON.stringify(correctSorted) === JSON.stringify(selectedSorted);

      return {
        questionId: q._id,
        selectedOptions,
        isCorrect,
        timeTaken: newTimings.get(q._id) || 0
      };
    });

    const correctAnswers = testAnswers.filter(a => a.isCorrect).length;
    const wrongAnswers = testAnswers.filter(a => !a.isCorrect && a.selectedOptions.length > 0).length;
    const unanswered = testAnswers.filter(a => a.selectedOptions.length === 0).length;
    const totalTimeTaken = duration * 60 - timeRemaining;
    const score = Math.round((correctAnswers / questions.length) * 100);

    const result: TestResult = {
      courseCode: selectedCourse!.code,
      courseName: selectedCourse!.name,
      weeks: selectedWeeks,
      duration,
      questions,
      answers: testAnswers,
      totalQuestions: questions.length,
      correctAnswers,
      wrongAnswers,
      unanswered,
      totalTimeTaken,
      score,
      timestamp: Date.now()
    };

    // Save to localStorage
    const existingResults = JSON.parse(localStorage.getItem('practiceTestResults') || '[]');
    existingResults.push(result);
    localStorage.setItem('practiceTestResults', JSON.stringify(existingResults));

    if (user?._id && selectedCourse) {
      const timestamp = Date.now();
      try {
        await createUserNptelAnalytics(user._id, 0, 1);
        await createDailyUserAnalytics(user._id, timestamp, undefined, undefined, 0, 1);
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
      }
    }

    setTestResult(result);
    setTestActive(false);
    setShowAnalysis(true);
    setEndingTest(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = currentQuestion ? answers.get(currentQuestion._id) || [] : [];

  if (showAnalysis && testResult) {
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
            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Heading size="8" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                Test Analysis
              </Heading>
              <Flex gap="2">
                <Button
                  onClick={() => {
                    setShowAnalysis(false);
                    setTestResult(null);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    fontWeight: 600,
                  }}
                >
                  <ResetIcon /> Take Another Test
                </Button>
                {/* <Button 
                  variant="soft" 
                  onClick={() => navigate('/')}
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <HomeIcon /> Home
                </Button> */}
              </Flex>
            </Flex>

            <Card className="hero-card" style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(99, 102, 241, 0.4)',
              padding: '0.75rem',
            }}>
              <Flex direction="column" gap="1">
                <Text size="4" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                  {testResult.courseName}
                </Text>
                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.8)' }}>
                  Weeks: {testResult.weeks.join(', ')}
                </Text>
                <Flex gap="4" style={{ marginTop: '1rem' }} wrap="wrap">
                  <Box>
                    <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                      {testResult.score}%
                    </Text>
                    <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)' }}> Score</Text>
                  </Box>

                  <Box>
                    <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                      {formatTime(testResult.totalTimeTaken)}
                    </Text>
                    <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)' }}> Time Taken</Text>
                  </Box>
                </Flex>
              </Flex>
            </Card>

            <Grid columns={{ initial: '3', sm: '3' }} gap="3">
              <Card className="feature-card" style={{
                background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                backdropFilter: 'blur(10px)',
                padding: '0.5rem',
              }}>
                <Flex direction="column" align="center" gap="1">
                  <CheckCircledIcon width={32} height={32} color="rgb(34, 197, 94)" />
                  <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                    {testResult.correctAnswers}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Correct</Text>
                </Flex>
              </Card>
              <Card className="feature-card" style={{
                background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(10px)',
                padding: '0.5rem',
              }}>
                <Flex direction="column" align="center" gap="1">
                  <CrossCircledIcon width={32} height={32} color="rgb(239, 68, 68)" />
                  <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                    {testResult.wrongAnswers}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Wrong</Text>
                </Flex>
              </Card>
              <Card className="feature-card" style={{
                background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                backdropFilter: 'blur(10px)',
                padding: '0.5rem',
              }}>
                <Flex direction="column" align="center" gap="1">
                  <ClockIcon width={32} height={32} color="rgb(251, 146, 60)" />
                  <Text size="5" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                    {testResult.unanswered}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Unanswered</Text>
                </Flex>
              </Card>
            </Grid>

            <Heading size="5" style={{ color: 'rgba(226, 232, 240, 0.95)', marginTop: '1rem' }}>
              Question-wise Analysis
            </Heading>
            <Flex direction="column" gap="3">
              {testResult.questions.map((question, index) => {
                const answer = testResult.answers[index];
                return (
                  <Card key={question._id} className="feature-card" style={{
                    background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                    border: `1.5px solid ${answer.isCorrect ? 'rgba(34, 197, 94, 0.4)' : answer.selectedOptions.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 146, 60, 0.4)'}`,
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem',
                  }}>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="start" gap="3">
                        <Text weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)', flex: 1 }}>
                          Q{index + 1}. {question.ps}
                        </Text>
                        <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
                          {answer.isCorrect ? (
                            <CheckCircledIcon color="rgb(34, 197, 94)" width={20} height={20} />
                          ) : answer.selectedOptions.length > 0 ? (
                            <CrossCircledIcon color="rgb(239, 68, 68)" width={20} height={20} />
                          ) : (
                            <Badge color="orange" variant="soft">Skipped</Badge>
                          )}
                          <Text size="2" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                            {formatTime(answer.timeTaken)}
                          </Text>
                        </Flex>
                      </Flex>

                      <Flex direction="column" gap="2">
                        {(shuffledOptions.get(question._id) || question.options).map((option, optIndex) => {
                          const isCorrect = question.correct.includes(option);
                          const isSelected = answer.selectedOptions.includes(option);
                          return (
                            <Box key={optIndex} style={{
                              padding: '0.75rem',
                              borderRadius: '8px',
                              background: isCorrect
                                ? 'rgba(34, 197, 94, 0.15)'
                                : isSelected
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(15, 23, 42, 0.5)',
                              border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.4)' : isSelected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'}`,
                            }}>
                              <Flex gap="2" align="center">
                                <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.95)', flex: 1 }}>
                                  {option}
                                </Text>
                                {isCorrect && <CheckCircledIcon color="rgb(34, 197, 94)" width={16} height={16} />}
                                {isSelected && !isCorrect && <CrossCircledIcon color="rgb(239, 68, 68)" width={16} height={16} />}
                              </Flex>
                            </Box>
                          );
                        })}
                      </Flex>

                      <Badge size="1" color="cyan" variant="soft" style={{ width: 'fit-content' }}>
                        Week {question.week}
                      </Badge>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </Flex>
        </Container>
      </Box>
    );
  }

  if (startingTest) {
    return <LoadingSpinner message="Preparing your test..." size="small" />;
  }

  if (endingTest) {
    return <LoadingSpinner message="Finalizing results..." size="small" />;
  }

  if (testActive && currentQuestion) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const timePercentage = (timeRemaining / (duration * 60)) * 100;

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
          <Flex direction="column" gap="4" mb="6">
            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Badge size="3" color="violet" variant="soft" style={{ backdropFilter: 'blur(10px)' }}>
                <LightningBoltIcon />
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>

              <Badge
                size="3"
                color={timePercentage > 30 ? 'green' : timePercentage > 10 ? 'orange' : 'red'}
                variant="soft"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ClockIcon />
                {formatTime(timeRemaining)}
              </Badge>

              <Button
                color="red"
                variant="soft"
                onClick={handleTestEnd}
                disabled={endingTest}
                style={{ backdropFilter: 'blur(10px)', opacity: endingTest ? 0.7 : 1 }}
              >
                End Test
              </Button>
            </Flex>

            <Flex direction="column" gap="2">
              <Progress
                value={progress}
                style={{
                  height: '8px',
                  background: 'rgba(15, 23, 42, 0.5)',
                }}
              />
              
              {/* Auto-Next Toggle */}
              <Flex justify="end" align="center">
                <Flex align="center" gap="2" style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                    Auto Next
                  </Text>
                  <Switch
                    checked={autoNextEnabled}
                    onCheckedChange={setAutoNextEnabled}
                    size="1"
                    style={{
                      cursor: 'pointer',
                    }}
                  />
                </Flex>
              </Flex>
            </Flex>
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
            padding: '1.75rem',
            position: 'relative',
          }}>
            <div className="card-shine"></div>

            <Flex direction="column" gap="4">
              {/* Week Badge */}
              <Badge size="2" color="cyan" variant="soft" style={{ width: 'fit-content' }}>
                Week {currentQuestion.week}
              </Badge>

              {/* Question Statement */}
              <Heading size="5" style={{
                color: 'rgba(226, 232, 240, 0.95)',
                lineHeight: 1.5,
                fontFamily: 'Poppins, sans-serif',
              }}>
                {currentQuestion.ps}
              </Heading>

              {/* Selection Type Hint */}
              <Badge
                size="1"
                color={currentQuestion.correct.length > 1 ? 'violet' : 'blue'}
                variant="soft"
                style={{ width: 'fit-content' }}
              >
                {currentQuestion.correct.length > 1 ? 'Multiple answers possible' : 'Single answer only'}
              </Badge>

              {/* Answer Options */}
              <Flex direction="column" gap="2" mt="1">
                {(shuffledOptions.get(currentQuestion._id) || currentQuestion.options).map((option, index) => {
                  const isMultiSelect = currentQuestion.correct.length > 1;
                  return (
                    <Card
                      key={index}
                      className="feature-card"
                      onClick={() => handleAnswerSelect(option)}
                      style={{
                        background: currentAnswers.includes(option)
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                          : 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                        border: currentAnswers.includes(option)
                          ? '2px solid rgba(99, 102, 241, 0.6)'
                          : '1px solid rgba(99, 102, 241, 0.2)',
                        backdropFilter: 'blur(10px)',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Flex align="center" gap="3">
                        <Box style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: isMultiSelect ? '4px' : '50%',
                          border: currentAnswers.includes(option) ? '2px solid #667eea' : '2px solid rgba(99, 102, 241, 0.3)',
                          background: currentAnswers.includes(option) ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {currentAnswers.includes(option) && <CheckCircledIcon color="white" width={16} height={16} />}
                        </Box>
                        <Text style={{ color: 'rgba(226, 232, 240, 0.95)', flex: 1 }}>{option}</Text>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </Flex>
          </Box>

          {/* Navigation */}
          <Flex justify="center" align="center" mt="4" wrap="nowrap" gap="3" style={{ width: '100%' }}>
            <Button
              disabled={currentQuestionIndex === 0}
              onClick={handlePreviousQuestion}
              variant="soft"
              size="3"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '0.7rem',
                minWidth: '48px',
              }}
            >
              <ChevronLeftIcon width="18" height="18" />
            </Button>

            <Box style={{
              flex: 1,
              maxWidth: '600px',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '4px 0',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(99, 102, 241, 0.5) transparent',
              display: 'flex',
              justifyContent: 'flex-start',
            }}>
              <Flex gap="2" style={{ flexWrap: 'nowrap', minWidth: 'max-content', margin:"auto" }}>
                {questions.map((_, index) => (
                  <Box
                    key={index}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: index === currentQuestionIndex ? '#667eea' :
                        answers.has(questions[index]._id) ? '#4ade80' : 'rgba(148, 163, 184, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: index === currentQuestionIndex ? '2px solid #667eea' : 'none',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      const currentQ = questions[currentQuestionIndex];
                      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
                      const newTimings = new Map(questionTimings);
                      newTimings.set(currentQ._id, (newTimings.get(currentQ._id) || 0) + timeTaken);
                      setQuestionTimings(newTimings);
                      setCurrentQuestionIndex(index);
                      setQuestionStartTime(Date.now());
                    }}
                  />
                ))}
              </Flex>
            </Box>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleTestEnd}
                size="3"
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  fontWeight: 600,
                  borderRadius: '0.7rem',
                  minWidth: '48px',
                }}
              >
                <CheckCircledIcon width="18" height="18" />
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                size="3"
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  fontWeight: 600,
                  borderRadius: '0.7rem',
                  minWidth: '48px',
                }}
              >
                <ChevronRightIcon width="18" height="18" />
              </Button>
            )}
          </Flex>
        </Container>
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
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Container size="3" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="6" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Flex direction="column" gap="5">
          <Flex
            direction={{ initial: 'column', md: 'row' }}
            justify="between"
            align={{ initial: 'start', md: 'center' }}
            gap="4"
          >
            <Heading size="8" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
              NPTEL Practice
            </Heading>

            {/* Search Bar */}
            <Box style={{
              width: '100%',
              maxWidth: '500px',
              position: 'relative',
              // border: '1.5px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '0.75rem',
              background: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(10px)',
            }}>
              <Box style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}>
                <MagnifyingGlassIcon width={20} height={20} style={{ color: 'rgba(148, 163, 184, 0.8)' }} />
              </Box>
              <TextField.Root
                size="3"
                placeholder="Search courses by name ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.75rem',
                  // background: 'transparent',
                  border: 'none',
                  // outline: 'none',
                  // borderRadius: '0.75rem',
                  color: 'rgba(226, 232, 240, 0.95)',
                  fontSize: '0.95rem',
                  // transition: 'all 0.3s ease',
                  boxShadow: 'none',
                }}
              />
            </Box>
          </Flex>

          {loading ? (
            <LoadingSpinner message="Loading courses..." size="small" />
          ) : courses.length === 0 ? (
            <Card className="hero-card" style={{
              background: 'rgba(35, 54, 85, 0.35)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(49, 84, 130, 0.4)',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <Text style={{ color: 'rgba(226, 232, 240, 0.9)' }}>No courses available. Please add courses first.</Text>
            </Card>
          ) : (
            <>
              {courses
                .filter(course =>
                  course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  course.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                <Card className="hero-card" style={{
                  background: 'rgba(35, 54, 85, 0.35)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(49, 84, 130, 0.4)',
                  padding: '2rem',
                  textAlign: 'center',
                }}>
                  <Text style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                    No courses found matching "{searchQuery}"
                  </Text>
                </Card>
              ) : (
                <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
                  {courses
                    .filter(course =>
                      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.code.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(course => (
                      <Card
                        key={course._id}
                        className="feature-card"
                        onClick={() => handleCourseClick(course)}
                        style={{
                          background: 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          backdropFilter: 'blur(10px)',
                          padding: '2rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '200px',
                        }}
                      >
                        <Flex direction="column" gap="3" style={{ height: '100%' }}>
                          <Flex align="start" gap="3" style={{ flex: 1 }}>
                            <Box style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '0.75rem',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              flexShrink: 0,
                            }}>
                              <BookmarkIcon width={24} height={24} />
                            </Box>
                            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                              <Heading size="4" style={{ color: 'rgba(226, 232, 240, 0.95)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                                {course.name}
                              </Heading>
                              <Flex gap="1" align="center">
                                <ClockIcon width={14} height={14} color="rgba(148, 163, 184, 0.8)" />
                                <Text size="1" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                                  {course.durationInWeeks} weeks
                                </Text>
                              </Flex>
                            </Flex>
                          </Flex>
                          <Button
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              fontWeight: 600,
                              width: '100%',
                            }}
                          >
                            Start Practice
                          </Button>
                        </Flex>
                      </Card>
                    ))}
                </Grid>
              )}
            </>
          )}

          {/* Week Selection Modal */}
          <Dialog.Root open={showModal} onOpenChange={setShowModal}>
            <Dialog.Content style={{
              maxWidth: 650,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '1rem',
            }}>
              <Dialog.Title style={{ color: 'rgba(226, 232, 240, 0.95)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Configure Test - {selectedCourse?.name}
              </Dialog.Title>
              <Dialog.Description size="2" mb="4" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                Select the weeks you want to practice and set the test duration.
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <Box>
                  <Flex justify="between" align="center" mb="3">
                    <Text size="2" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>Select Weeks:</Text>
                    <Button
                      size="1"
                      variant="soft"
                      onClick={handleSelectAllWeeks}
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {selectedCourse && selectedWeeks.length === selectedCourse.durationInWeeks ? 'Deselect All' : 'Select All'}
                    </Button>
                  </Flex>
                  <Grid columns="4" gap="2">
                    {selectedCourse && Array.from({ length: selectedCourse.durationInWeeks + 1}, (_, i) => i).map(week => (
                      <Card
                        key={week}
                        style={{
                          cursor: 'pointer',
                          background: selectedWeeks.includes(week)
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)',
                          border: selectedWeeks.includes(week) ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid rgba(99, 102, 241, 0.2)',
                          textAlign: 'center',
                          padding: '0.4rem',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => handleWeekToggle(week)}
                      >
                        <Text size="1" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>Week {week}</Text>
                      </Card>
                    ))}
                  </Grid>
                </Box>

                {availableQuestions > 0 && (
                  <Box>
                    <Flex justify="between" align="center" mb="2">
                      <Text size="2" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                        Number of Questions:
                      </Text>
                      <Badge size="2" color="cyan" variant="soft">
                        {availableQuestions} available
                      </Badge>
                    </Flex>
                    <Flex gap="2" wrap="wrap">
                      <Button
                        size="2"
                        variant={questionLimit === 0 ? 'solid' : 'soft'}
                        onClick={() => setQuestionLimit(0)}
                        style={{
                          background: questionLimit === 0
                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                            : 'rgba(99, 102, 241, 0.2)',
                          border: questionLimit === 0 ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        All ({availableQuestions})
                      </Button>
                      {[
                        Math.ceil(availableQuestions * 0.25),
                        Math.ceil(availableQuestions * 0.5),
                        Math.ceil(availableQuestions * 0.75),
                      ].filter((num, idx, arr) => num > 0 && num < availableQuestions && arr.indexOf(num) === idx).map(num => (
                        <Button
                          key={num}
                          size="2"
                          variant={questionLimit === num ? 'solid' : 'soft'}
                          onClick={() => setQuestionLimit(num)}
                          style={{
                            background: questionLimit === num
                              ? 'linear-gradient(135deg, #667eea, #764ba2)'
                              : 'rgba(99, 102, 241, 0.2)',
                            border: questionLimit === num ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
                            fontWeight: 600,
                          }}
                        >
                          {num} ({Math.round((num / availableQuestions) * 100)}%)
                        </Button>
                      ))}
                    </Flex>
                    <Flex align="center" gap="3" mt="3">
                      <Text size="1" style={{ color: 'rgba(148, 163, 184, 0.8)', minWidth: '60px' }}>
                        Custom:
                      </Text>
                      <TextField.Root
                        type="number"
                        size="2"
                        min="1"
                        max={availableQuestions}
                        placeholder="Enter number"
                        value={questionLimit > 0 ? questionLimit.toString() : ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0 && val <= availableQuestions) {
                            setQuestionLimit(val);
                          } else if (e.target.value === '') {
                            setQuestionLimit(0);
                          }
                        }}
                        style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'white',
                          flex: 1,
                        }}
                      />
                    </Flex>
                  </Box>
                )}

                <Box>
                  <Text size="2" weight="bold" mb="3" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>Test Duration (minutes):</Text>
                  <Flex gap="2" wrap="wrap">
                    {[15, 30, 45, 60, 90].map(mins => (
                      <Button
                        key={mins}
                        variant={duration === mins ? 'solid' : 'soft'}
                        onClick={() => setDuration(mins)}
                        style={{
                          background: duration === mins
                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                            : 'rgba(99, 102, 241, 0.2)',
                          border: duration === mins ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        {mins}m
                      </Button>
                    ))}
                  </Flex>
                </Box>

                <Box>
                  <Flex align="center" justify="between" style={{
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}>
                    <Flex align="center" gap="3">
                      <Box style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: shuffleEnabled ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}>
                        <ShuffleIcon width={18} height={18} style={{ color: 'white' }} />
                      </Box>
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                          Shuffle Answer Options
                        </Text>
                        <Text size="1" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                          Randomize the order of answer options
                        </Text>
                      </Flex>
                    </Flex>
                    <Switch
                      checked={shuffleEnabled}
                      onCheckedChange={setShuffleEnabled}
                      size="2"
                      style={{
                        cursor: 'pointer',
                      }}
                    />
                  </Flex>
                </Box>

                <Flex gap="3" justify="end" mt="2">
                  <Dialog.Close>
                    <Button
                      variant="soft"
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    disabled={selectedWeeks.length === 0 || startingTest}
                    onClick={handleStartTest}
                    style={{
                      background: selectedWeeks.length === 0 || startingTest
                        ? 'rgba(99, 102, 241, 0.3)'
                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                      fontWeight: 600,
                      cursor: selectedWeeks.length === 0 || startingTest ? 'not-allowed' : 'pointer',
                      opacity: startingTest ? 0.7 : 1,
                    }}
                  >
                    {startingTest ? 'Starting...' : 'Start Test'}
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
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
