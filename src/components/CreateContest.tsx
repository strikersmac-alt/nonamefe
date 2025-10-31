import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Card, Container, Button, TextField, Select, Badge, Grid, Dialog } from '@radix-ui/themes';
import { RocketIcon, CheckCircledIcon, CrossCircledIcon, BookmarkIcon, CopyIcon, Link2Icon } from '@radix-ui/react-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { createUserContestAnalytics, createDailyUserAnalytics, createContestAnalytics } from '../services/analyticsService';
import '../App.css';
import useDocumentTitle from '../hooks/useDocumentTitle';
interface FormData {
  topic: string;
  difficulty: string;
  numQuestions: string;
  mode: string;
  duration: string;
  startTime: string;
  contestType: 'normal' | 'nptel';
  courseCode: string;
  weeks: number[];
}

interface Course {
  _id: string;
  name: string;
  code: string;
  durationInWeeks: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  code?: string;
}

interface ContestMeta {
  code: string;
  mode: string;
  contestType: 'normal' | 'nptel';
  isLive: boolean;
  duration: number;
  startTime: string;
  timeZone: string;
  id: string;
  adminId: string;
}

export default function CreateContest() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    difficulty: 'medium',
    numQuestions: '10',
    mode: 'duel',
    duration: '10',
    startTime: '',
    contestType: 'normal',
    courseCode: '',
    weeks: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  useDocumentTitle("MindMuse - Create Contest");
  useEffect(() => {
    if (formData.contestType === 'nptel') {
      fetchCourses();
    }
  }, [formData.contestType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.course-dropdown-container')) {
        setShowCourseDropdown(false);
      }
    };

    if (showCourseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCourseDropdown]);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const response = await axios.get<{ courses: Course[] }>(`${import.meta.env.VITE_API_URL}/api/course/courses`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setFormData(prev => ({ ...prev, courseCode: course.code, weeks: [] }));
    setShowWeekModal(true);
  };

  const handleWeekToggle = (week: number) => {
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.includes(week)
        ? prev.weeks.filter(w => w !== week)
        : [...prev.weeks, week]
    }));
  };

  const handleSelectAllWeeks = () => {
    if (!selectedCourse) return;
    const allWeeks = Array.from({ length: selectedCourse.durationInWeeks }, (_, i) => i + 1);
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.length === allWeeks.length ? [] : allWeeks
    }));
  };

  const handleRandomWeeks = () => {
    setFormData(prev => ({ ...prev, weeks: [-1] })); // -1 indicates random
    setShowWeekModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingProgress(0);
    setResponse(null);

    // Progress animation - complete in 13 seconds
    const totalDuration = 15000; // 13 seconds
    const intervalTime = 100; // Update every 100ms
    const incrementPerInterval = (100 / totalDuration) * intervalTime;
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + incrementPerInterval;
        if (next >= 95) {
          clearInterval(progressInterval);
          return 95; // Stop at 95% until data arrives
        }
        return next;
      });
    }, intervalTime);

    try {
      // Get auth token from cookies
      // const token = Cookies.get('authToken');
      // if (!token) {
      //   setResponse({
      //     success: false,
      //     message: 'Please sign in to create a contest',
      //   });
      //   setLoading(false);
      //   return;
      // }

      let result;

      if (formData.contestType === 'nptel') {
        // NPTEL contest creation
        if (!formData.courseCode || formData.weeks.length === 0) {
          clearInterval(progressInterval);
          setResponse({
            success: false,
            message: 'Please select a course and at least one week',
          });
          setLoading(false);
          setLoadingProgress(0);
          return;
        }

        const payload = {
          courseCode: formData.courseCode,
          weeks: formData.weeks,
          numQuestions: parseInt(formData.numQuestions, 10),
          mode: formData.mode,
          duration: parseInt(formData.duration, 10),
          startTime: formData.startTime || Math.floor(Date.now() / 1000).toString(),
          timeZone: 'UTC',
        };

        result = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_API_URL}/api/quiz/createNptelContest`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          },
        );
      } else {
        // Normal AI-generated contest creation
        const payload = {
          topic: formData.topic,
          difficulty: formData.difficulty,
          numQuestions: parseInt(formData.numQuestions, 10),
          mode: formData.mode,
          duration: parseInt(formData.duration, 10),
          startTime: formData.startTime || Math.floor(Date.now() / 1000).toString(),
          timeZone: 'UTC',
        };

        result = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_API_URL}/api/quiz/createContest`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            withCredentials: true,
          }
        );
      }

      if (result.data.success && result.data.code) {
        if (user?._id) {
          const timestamp = Date.now();
          try {
            
            await createUserContestAnalytics(
              user._id,
              formData.contestType,
              formData.mode as 'duel' | 'practice' | 'multiplayer'
            );

            await createDailyUserAnalytics(
              user._id,
              timestamp,
              formData.contestType,
              formData.mode as 'duel' | 'practice' | 'multiplayer'
            );
          } catch (analyticsError) {
            console.error('Analytics tracking failed:', analyticsError);
          }
        }

        // Automatically join the contest by fetching its metadata
        try {
          const contestResponse = await axios.get<{ success: boolean; meta: ContestMeta }>(
            `${import.meta.env.VITE_API_URL}/api/contest/code/${result.data.code}/questions`
          );

          if (contestResponse.data.success && contestResponse.data.meta) {
            // Track contest analytics
            if (contestResponse.data.meta.id) {
              try {
                await createContestAnalytics(
                  contestResponse.data.meta.id,
                  Date.now(),
                  formData.contestType === 'normal' ? formData.topic : selectedCourse?.name || 'ai'
                );
              } catch (analyticsError) {
                console.error('Contest analytics tracking failed:', analyticsError);
              }
            }

            // Navigate directly to waiting room
            navigate(`/contest/${contestResponse.data.meta.id}/waiting`, {
              state: { contestMeta: contestResponse.data.meta }
            });
            return;
          }
        } catch (joinError) {
          // If auto-join fails, show success message with code
          setResponse(result.data);
        }
      } else {
        setResponse(result.data);
      }
    } catch (error: any) {
      setResponse({
        success: false,
        message: error.response?.data?.message || 'Unable to create contest. Please try again.',
      });
    } finally {
      // Clear interval and rush to 100% when done
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 500); // Small delay to show 100%
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
      {/* Loading Overlay */}
      {loading && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(18, 20, 28, 0.95) 50%, rgba(9, 10, 16, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            style={{
              maxWidth: '500px',
              width: '90%',
              background: 'rgba(35, 54, 85, 0.4)',
              borderRadius: '2rem',
              boxShadow: '0 8px 64px 0 rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              padding: '3rem 2rem',
              position: 'relative',
            }}
          >
            <Flex direction="column" align="center" gap="5">
              {/* Animated Spinner */}
              <Box
                style={{
                  width: '80px',
                  height: '80px',
                  border: '4px solid rgba(99, 102, 241, 0.2)',
                  borderTop: '4px solid #667eea',
                  borderRight: '4px solid #764ba2',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)',
                }}
              />
              
              {/* Loading Text */}
              <Flex direction="column" align="center" gap="2">
                <Heading
                  size="6"
                  className="glow-text-enhanced"
                  style={{
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Creating Your Contest
                </Heading>
                <Text
                  size="3"
                  style={{
                    color: 'rgba(226, 232, 240, 0.8)',
                    textAlign: 'center',
                  }}
                >
                  Please wait while we generate your questions...
                </Text>
              </Flex>
              
              {/* Progress Bar */}
              <Box style={{ width: '100%' }}>
                <Flex justify="between" align="center" mb="2">
                  <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                    Progress
                  </Text>
                  <Text size="3" weight="bold" style={{ 
                    color: '#a78bfa',
                    textShadow: '0 0 10px rgba(167, 139, 250, 0.5)',
                  }}>
                    {Math.round(loadingProgress)}%
                  </Text>
                </Flex>
                <Box
                  style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  <Box
                    style={{
                      width: `${loadingProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f472b6 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease-out',
                      boxShadow: '0 0 15px rgba(102, 126, 234, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      position: 'relative',
                    }}
                  >
                    <Box
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                        animation: 'shimmer 2s infinite',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Flex>
          </Box>
        </Box>
      )}
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Container size="3" px={{ initial: '4', sm: '5', md: '6' }} pt={{ initial: '4', md: '5' }} pb="4" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Back Button */}
        {/* <Button
          variant="soft"
          color="gray"
          size="2"
          onClick={() => navigate('/')}
          style={{
            marginBottom: '1rem',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ArrowLeftIcon /> Back to Home
        </Button> */}

        {/* Main Form Card */}
        <Flex direction="column" align="center" gap="3">
          {!response?.success && (
            <Box className="hero-card" style={{
              width: '100%',
              maxWidth: '720px',
              background: 'rgba(35, 54, 85, 0.35)',
              borderRadius: 'clamp(1.5rem, 4vw, 2.5rem)',
              boxShadow: '0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(49, 84, 130, 0.4)',
              padding: 'clamp(1.25rem, 3vw, 1.75rem) clamp(1.5rem, 4vw, 2.5rem)',
              position: 'relative',
            }}>
              <div className="card-shine"></div>


              <Heading size="8" className="glow-text-enhanced" style={{
                letterSpacing: '-0.02em',
                fontWeight: 800,
                marginBottom: '0.5rem',
                fontFamily: 'Poppins, sans-serif',
              }}>
                Create Contest
              </Heading>

              <Text size="3" as="p" style={{
                color: 'rgba(226, 232, 240, 0.85)',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
                fontFamily: 'Poppins, sans-serif',
              }}>
                Generate an AI-powered quiz contest with custom parameters. Fill in the details below to create your unique contest.
              </Text>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="3">
                  {/* Contest Type */}
                  <Box>
                    <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                      Contest Type <span style={{ color: '#f472b6' }}>*</span>
                    </Text>
                    <Select.Root
                      value={formData.contestType}
                      onValueChange={(value) => handleInputChange('contestType', value as 'normal' | 'nptel')}
                      size="3"
                    >
                      <Select.Trigger
                        style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'white',
                          width: '100%',
                        }}
                      />
                      <Select.Content>
                        <Select.Item value="normal">Normal (AI Generated)</Select.Item>
                        <Select.Item value="nptel">NPTEL Questions</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  {/* NPTEL Course Selection */}
                  {formData.contestType === 'nptel' && (
                    <Box>
                      <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                        Select Course <span style={{ color: '#f472b6' }}>*</span>
                      </Text>
                      {coursesLoading ? (
                        <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Loading courses...</Text>
                      ) : courses.length === 0 ? (
                        <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)' }}>No courses available</Text>
                      ) : (
                        <Box className="course-dropdown-container" style={{ position: 'relative', width: '100%' }}>
                          <Box style={{ position: 'relative', width: '100%' }}>
                            <input
                              type="text"
                              placeholder="Search for a course..."
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              onFocus={(e) => {
                                setShowCourseDropdown(true);
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                              }}
                              style={{
                                width: '100%',
                                padding: '0.625rem 1rem 0.625rem 2.5rem',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '0.875rem',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                boxSizing: 'border-box',
                                height: '40px',
                              }}
                            />
                            <BookmarkIcon
                              width={16}
                              height={16}
                              style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'rgba(148, 163, 184, 0.7)',
                                pointerEvents: 'none'
                              }}
                            />
                          </Box>

                          {selectedCourse && !showCourseDropdown && (
                            <Badge color="green" variant="soft" style={{ marginTop: '0.5rem' }}>
                              Selected: {selectedCourse.name}
                              {formData.weeks.length > 0 && ` • ${formData.weeks.includes(-1) ? 'Random weeks' : `${formData.weeks.length} week(s)`}`}
                            </Badge>
                          )}

                          {showCourseDropdown && (
                            <Box
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.5rem)',
                                left: 0,
                                right: 0,
                                maxHeight: '250px',
                                overflowY: 'auto',
                                background: 'rgba(15, 23, 42, 0.98)',
                                backdropFilter: 'blur(20px)',
                                border: '1.5px solid rgba(99, 102, 241, 0.4)',
                                borderRadius: '0.75rem',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                                zIndex: 1000,
                              }}
                              className="custom-scrollbar"
                            >
                              {courses
                                .filter(course =>
                                  course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                                  course.code.toLowerCase().includes(courseSearch.toLowerCase())
                                )
                                .map(course => (
                                  <Box
                                    key={course._id}
                                    onClick={() => {
                                      handleCourseSelect(course);
                                      setShowCourseDropdown(false);
                                      setCourseSearch(course.name);
                                    }}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      background: selectedCourse?._id === course._id
                                        ? 'rgba(99, 102, 241, 0.2)'
                                        : 'transparent',
                                      borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                                      transition: 'background 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (selectedCourse?._id !== course._id) {
                                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedCourse?._id !== course._id) {
                                        e.currentTarget.style.background = 'transparent';
                                      }
                                    }}
                                  >
                                    <Flex direction="column" gap="1">
                                      <Text size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                                        {course.name}
                                      </Text>
                                      <Text size="1" style={{ color: 'rgba(148, 163, 184, 0.7)' }}>
                                        {course.code} • {course.durationInWeeks} weeks
                                      </Text>
                                    </Flex>
                                  </Box>
                                ))}
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Topic - Only for Normal contests */}
                  {formData.contestType === 'normal' && (
                    <Box>
                      <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                        Topic <span style={{ color: '#f472b6' }}>*</span>
                      </Text>
                      <TextField.Root
                        size="3"
                        placeholder="e.g., World History, Science, Technology"
                        value={formData.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                        required
                        style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'white',
                        }}
                      />
                    </Box>
                  )}

                  {/* Difficulty - Only for Normal contests */}
                  {formData.contestType === 'normal' && (
                    <Box>
                      <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                        Difficulty <span style={{ color: '#f472b6' }}>*</span>
                      </Text>
                      <Select.Root
                        value={formData.difficulty}
                        onValueChange={(value) => handleInputChange('difficulty', value)}
                        size="3"
                      >
                        <Select.Trigger
                          style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'white',
                            width: '100%',
                          }}
                        />
                        <Select.Content>
                          <Select.Item value="easy">Easy</Select.Item>
                          <Select.Item value="medium">Medium</Select.Item>
                          <Select.Item value="hard">Hard</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>
                  )}

                  {/* Number of Questions */}
                  <Box>
                    <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                      Number of Questions <span style={{ color: '#f472b6' }}>*</span>
                    </Text>
                    <TextField.Root
                      size="3"
                      type="number"
                      placeholder="10"
                      value={formData.numQuestions}
                      onChange={(e) => handleInputChange('numQuestions', e.target.value)}
                      min="1"
                      max="50"
                      required
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'white',
                      }}
                    />
                  </Box>

                  {/* Mode */}
                  <Box>
                    <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                      Mode
                    </Text>
                    <Select.Root
                      value={formData.mode}
                      onValueChange={(value) => handleInputChange('mode', value)}
                      size="3"
                    >
                      <Select.Trigger
                        style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'white',
                          width: '100%',
                        }}
                      />
                      <Select.Content>
                        <Select.Item value="duel">Duel</Select.Item>
                        <Select.Item value="practice">Practice</Select.Item>
                        <Select.Item value="multiplayer">Multiplayer</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  {/* Duration */}
                  <Box>
                    <Text as="label" size="2" weight="medium" style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '0.5rem', display: 'block' }}>
                      Duration (minutes)
                    </Text>
                    <TextField.Root
                      size="3"
                      type="number"
                      placeholder="10"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      min="1"
                      max="180"
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'white',
                      }}
                    />
                  </Box>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="3"
                    disabled={loading}
                    style={{
                      marginTop: '0.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      fontWeight: 600,
                    }}
                  >
                    <RocketIcon />
                    {loading ? 'Creating Contest...' : 'Create Contest'}
                  </Button>
                </Flex>
              </form>
            </Box>
          )}

          {/* Response Card */}
          {response && (
            <Card className="hero-card" style={{
              width: '100%',
              maxWidth: '720px',
              background: response.success
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '1.5rem',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: response.success
                ? '1.5px solid rgba(16, 185, 129, 0.3)'
                : '1.5px solid rgba(239, 68, 68, 0.3)',
              padding: '2rem',
              animation: 'scaleIn 0.3s ease-out',
            }}>
              <Flex direction="column" gap="3" align="center">
                {response.success ? (
                  <>
                    <CheckCircledIcon width={48} height={48} color="#10b981" />
                    <Heading size="6" style={{ color: '#10b981', fontWeight: 700 }}>
                      Contest Created Successfully!
                    </Heading>
                    <Text size="3" style={{ color: 'rgba(226, 232, 240, 0.9)', textAlign: 'center' }}>
                      {response.message}
                    </Text>
                    {response.code && (
                      <Flex direction="column" gap="3" style={{ width: '100%', marginTop: '0.5rem' }}>
                        <Box style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          padding: '1rem 2rem',
                          borderRadius: '1rem',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }}>
                          <Text size="2" style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '0.25rem', display: 'block' }}>
                            Contest Code:
                          </Text>
                          <Text size="8" weight="bold" style={{
                            color: '#10b981',
                            fontFamily: 'monospace',
                            letterSpacing: '0.1em',
                          }}>
                            {response.code}
                          </Text>
                        </Box>
                        
                        <Flex gap="2" wrap="wrap" justify="center">
                          <Button
                            size="3"
                            variant="soft"
                            onClick={() => {
                              navigator.clipboard.writeText(response.code!);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              cursor: 'pointer',
                            }}
                          >
                            <CopyIcon />
                            {copied ? 'Copied!' : 'Copy Code'}
                          </Button>
                          
                          <Button
                            size="3"
                            variant="soft"
                            onClick={() => {
                              const joinLink = `${window.location.origin}/join-contest?code=${response.code}`;
                              const topicText = formData.contestType === 'nptel' 
                                ? selectedCourse?.name || 'NPTEL Course'
                                : formData.topic || 'Quiz';
                              const customMessage = `Hey! Join me in a contest on "${topicText}"!\n\n${joinLink}`;
                              navigator.clipboard.writeText(customMessage);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              cursor: 'pointer',
                            }}
                          >
                            <Link2Icon />
                            {linkCopied ? 'Link Copied!' : 'Copy Link'}
                          </Button>
                        </Flex>
                      </Flex>
                    )}
                  </>
                ) : (
                  <>
                    <CrossCircledIcon width={48} height={48} color="#ef4444" />
                    <Heading size="6" style={{ color: '#ef4444', fontWeight: 700 }}>
                      Error Creating Contest
                    </Heading>
                    <Text size="3" style={{ color: 'rgba(226, 232, 240, 0.9)', textAlign: 'center' }}>
                      {response.message}
                    </Text>
                  </>
                )}
              </Flex>
            </Card>
          )}
        </Flex>
      </Container>

      {/* Week Selection Modal */}
      <Dialog.Root open={showWeekModal} onOpenChange={setShowWeekModal}>
        <Dialog.Content style={{
          maxWidth: 650,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(99, 102, 241, 0.4)',
        }}>
          <Dialog.Title style={{ color: 'rgba(226, 232, 240, 0.95)', marginBottom: '1rem' }}>
            Select Weeks for {selectedCourse?.name}
          </Dialog.Title>

          <Flex direction="column" gap="3">
            <Flex gap="2" wrap="wrap">
              <Button
                variant="soft"
                onClick={handleSelectAllWeeks}
                style={{ background: 'rgba(99, 102, 241, 0.2)' }}
              >
                {formData.weeks.length === selectedCourse?.durationInWeeks ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="soft"
                onClick={handleRandomWeeks}
                style={{ background: 'rgba(139, 92, 246, 0.2)' }}
              >
                Random Weeks
              </Button>
            </Flex>

            <Grid columns="4" gap="2" style={{ width: '100%' }}>
              {selectedCourse && Array.from({ length: selectedCourse.durationInWeeks }, (_, i) => i + 1).map(week => (
                <Card
                  key={week}
                  onClick={() => handleWeekToggle(week)}
                  style={{
                    background: formData.weeks.includes(week)
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                      : 'rgba(15, 23, 42, 0.5)',
                    border: formData.weeks.includes(week)
                      ? '1px solid rgba(99, 102, 241, 0.6)'
                      : '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    // minWidth: 0,
                  }}
                >
                  <Flex align="center" justify="center" gap="1" style={{ minWidth: 0 }}>
                    {/* <Checkbox checked={formData.weeks.includes(week)} style={{ flexShrink: 0 }} /> */}
                    <Text size="1" weight="medium" style={{ 
                      color: 'rgba(226, 232, 240, 0.95)',
                      // whiteSpace: 'nowrap',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      Week {week}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Grid>

            <Flex gap="2" justify="end" mt="2">
              <Button
                variant="soft"
                onClick={() => setShowWeekModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowWeekModal(false)}
                disabled={formData.weeks.length === 0}
                style={{
                  background: formData.weeks.length > 0
                    ? 'linear-gradient(135deg, #667eea, #764ba2)'
                    : 'rgba(100, 100, 100, 0.3)',
                  cursor: formData.weeks.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm ({formData.weeks.length} selected)
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

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


