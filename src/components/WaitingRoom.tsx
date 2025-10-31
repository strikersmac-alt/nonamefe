import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Card,
  Container,
  Button,
  Badge,
  Avatar,
  Grid,
} from "@radix-ui/themes";
import {
  PersonIcon,
  RocketIcon,
  CheckCircledIcon,
  ClockIcon,
  Link2Icon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import "../App.css";
import { useAuthStore } from "../store/authStore";
import useDocumentTitle from "../hooks/useDocumentTitle";
interface Participant {
  userId: string;
  name: string;
  profilePicture: string;
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
  status?: string;
  contestType?: string; // normal or nptel
  topic?: string;
}

export default function WaitingRoom() {
  const navigate = useNavigate();
  const { contestId } = useParams<{ contestId: string }>();
  const location = useLocation();
  // const contestMeta = location.state?.contestMeta as ContestMeta;
  const initialContestMeta = location.state?.contestMeta as ContestMeta;
  const [contestMeta, setContestMeta] = useState<ContestMeta | null>(
    initialContestMeta
  );

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // TODO: Set to true if current user is contest creator
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const user = useAuthStore((state) => state.user);
  useDocumentTitle("MindMuse - Waiting Room");
  
  // Add class to body for mobile styling (hide bottom nav)
  useEffect(() => {
    document.body.classList.add('contest-play-page');
    return () => {
      document.body.classList.remove('contest-play-page');
    };
  }, []);
  
  useEffect(() => {
    // Check if contest is already completed
    const completedContests = JSON.parse(
      localStorage.getItem("completedContests") || "[]"
    );
    if (completedContests.includes(contestId)) {
      // Contest already completed, redirect to standings
      navigate(`/contest/${contestId}/standings`, {
        state: { contestMeta: initialContestMeta }, // using initial here
        replace: true,
      });
      return;
    }

    const checkContestStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/contest/${contestId}/questions`
        );

        if (response.data.success && response.data.meta) {
          const meta = response.data.meta;
          const questions = response.data.questions;

          let topic = null;
          if (questions && questions.length > 0) {
            topic = questions[0].topic; // Get the topic from the first question
          }
          const fullMeta = { ...meta, topic: topic };
          setContestMeta(fullMeta); // Update the state

          if (meta.isLive) {
            try {
              const summaryResponse = await axios.get(
                `${
                  import.meta.env.VITE_API_URL
                }/api/contest/${contestId}/summary`,
                { withCredentials: true }
              );

              if (summaryResponse.data.success) {
                const userAnswers = summaryResponse.data.userAnswers || [];

                if (userAnswers.length > 0) {
                  // console.log('Contest is live and user has previous answers, redirecting to play...');
                  navigate(`/contest/${contestId}/play`, {
                    state: {
                      contestMeta: {
                        ...fullMeta,
                        isLive: true,
                      },
                      resuming: true,
                    },
                    replace: true,
                  });
                  return;
                }
              }
            } catch (summaryError) {
              // console.log('User has not started the contest yet');
            }
          }
        }
      } catch (error) {
        console.error("Error checking contest status:", error);
      }
    };

    checkContestStatus();

    // Decode JWT to get current user ID and check if admin
    try {
      const payload = user;
      const currentUserId = payload?._id;

      // console.log('🔍 Frontend - Decoded JWT payload:', {
      // userId: payload?._id,
      // email: payload?.email
      // });
      // console.log('👤 Frontend - Current user ID:', currentUserId);
      // console.log('🎯 Frontend - Contest admin ID:', contestMeta?.adminId);

      // Check if current user is the contest admin
      if (initialContestMeta && initialContestMeta.adminId === currentUserId) {
        setIsAdmin(true);
        // console.log('✅ Frontend - User is admin');
      } else {
        // console.log('❌ Frontend - User is NOT admin');
      }
    } catch (err) {
      // Silently handle token error
    }

    // Initialize socket connection
    const socketInstance = io(`${import.meta.env.VITE_API_URL}`, {
      withCredentials: true,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setConnected(true);
      // console.log("here we go 1")
      // Join the contest room
      socketInstance.emit("joinContest", contestId, (response: any) => {
        // console.log(response);
        if (!response.success) {
          // console.log("here we go 2");
          setError(response.message || "Failed to join contest");
          // console.log(response.message);
          // Don't redirect immediately, show error message
        }
      });
    });

    socketInstance.on("connect_error", (err) => {
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    socketInstance.on(
      "updateParticipants",
      (updatedParticipants: Participant[]) => {
        // console.log('📋 Frontend - Received updateParticipants:', updatedParticipants);
        setParticipants(updatedParticipants);
      }
    );

    socketInstance.on("contestStarted", (data) => {
      // Clear any errors and navigate to contest play page when admin starts the contest
      setError(null);
      navigate(`/contest/${contestId}/play`, {
        state: {
          contestMeta: {
            ...contestMeta,
            isLive: true,
            startTime: data.startTime,
          },
        },
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [contestId, navigate, initialContestMeta, user]);

  const handleStartContest = () => {
    if (socket && isAdmin) {
      socket.emit("startContest", contestId, (response: any) => {
        if (!response.success) {
          setError(response.message);
        }
      });
    }
  };

  const copyContestLink = async () => {
    if (contestMeta?.code) {
      try {
        const joinLink = `${window.location.origin}/join-contest?code=${contestMeta.code}`;
        const topicText = contestMeta.topic || 'Quiz Contest';
        const customMessage = `Hey! Join me in a contest on "${topicText}"!\n\n${joinLink}`;
        await navigator.clipboard.writeText(customMessage);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
        // Fallback method
        const textArea = document.createElement("textarea");
        const joinLink = `${window.location.origin}/join-contest?code=${contestMeta.code}`;
        const topicText = contestMeta.topic || 'Quiz Contest';
        const customMessage = `Hey! Join me in a contest on "${topicText}"!\n\n${joinLink}`;
        textArea.value = customMessage;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        } catch (fallbackErr) {
          console.error("Fallback copy failed:", fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const getModeDisplay = (mode: string) => {
    switch (mode) {
      case "duel":
        return { text: "Duel", color: "orange", limit: 2 };
      case "multiplayer":
        return { text: "Multiplayer", color: "blue", limit: null };
      case "practice":
        return { text: "Practice", color: "green", limit: 1 };
      default:
        return { text: mode, color: "gray", limit: null };
    }
  };

  const modeInfo = contestMeta
    ? getModeDisplay(contestMeta.mode)
    : { text: "", color: "gray", limit: null };
  const canStart = modeInfo.limit
    ? participants.length >= modeInfo.limit
    : participants.length > 0;

  return (
    <Box
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        paddingTop: "70px",
        paddingBottom: "0",
      }}
    >
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <Container
        size="4"
        px={{ initial: "4", sm: "5", md: "6" }}
        pt={{ initial: "4", md: "5" }}
        pb="6"
        style={{ flex: 1, position: "relative", zIndex: 1 }}
      >
        {/* Header Section */}
        <Flex direction="column" align="center" gap="4" mb="6">
          <Badge
            size="2"
            color={connected ? "green" : "red"}
            variant="soft"
            style={{ backdropFilter: "blur(10px)" }}
          >
            {connected ? <CheckCircledIcon /> : <ClockIcon />}
            {connected ? "Connected" : "Connecting..."}
          </Badge>

          <Heading
            size="9"
            className="glow-text-enhanced"
            style={{
              letterSpacing: "-0.02em",
              fontWeight: 800,
              fontFamily: "Poppins, sans-serif",
              textAlign: "center",
              marginBottom: "0.5rem",
              padding: "0.5rem 0",
              lineHeight: "1.2",
            }}
          >
            Waiting Room
          </Heading>

          {contestMeta && (
            <Flex
              direction="column"
              gap="4"
              align="center"
              style={{ width: "100%", maxWidth: "900px" }}
            >
              {/* Contest Code Card - Compact */}
              <Card
                style={{
                  background: "rgba(35, 54, 85, 0.5)",
                  backdropFilter: "blur(24px)",
                  border: "1.5px solid rgba(99, 102, 241, 0.4)",
                  padding: "0.75rem 1.5rem",
                  width: "100%",
                  maxWidth: "500px",
                  boxShadow: "0 4px 24px rgba(30, 41, 59, 0.4)",
                }}
              >
                <Flex align="center" gap="3" wrap="wrap" justify="center">
                  <Flex align="center" gap="2">
                    <Text
                      size="2"
                      style={{
                        color: "#94a3b8",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "0.75rem",
                      }}
                    >
                      Code:
                    </Text>
                    <Text
                      size="6"
                      weight="bold"
                      style={{
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "0.3em",
                        color: "#60a5fa",
                        fontSize: "1.5rem",
                        textShadow: "0 0 20px rgba(96, 165, 250, 0.3)",
                      }}
                    >
                      {contestMeta.code}
                    </Text>
                  </Flex>
                  <Button
                    size="2"
                    variant="soft"
                    color="blue"
                    onClick={copyContestLink}
                    style={{
                      cursor: "pointer",
                      fontWeight: 600,
                      borderRadius: "0.5rem",
                    }}
                  >
                    <Link2Icon />
                    {linkCopied ? "Copied!" : "Link"}
                  </Button>
                </Flex>
              </Card>

              {/* Topic Card - Featured */}
              {contestMeta.topic && (
                <Card
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    padding: "0.75rem 1.5rem",
                    width: "100%",
                    maxWidth: "600px",
                  }}
                >
                  <Flex direction="column" align="center" gap="2">
                    <Flex align="center" gap="2">
                      <FileTextIcon
                        width={18}
                        height={18}
                        style={{ color: "#06b6d4" }}
                      />
                      <Text
                        size="4"
                        weight="bold"
                        style={{
                          color: "#e2e8f0",
                          textAlign: "center",
                        }}
                      >
                        {contestMeta.topic}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>
              )}

              {/* Badges Row */}
              <Flex gap="2" align="center" wrap="wrap" justify="center">
                {contestMeta.contestType &&
                  contestMeta.contestType !== "normal" && (
                    <Badge size="2" color="purple" variant="soft">
                      {contestMeta.contestType}
                    </Badge>
                  )}

                <Badge size="2" color={modeInfo.color as any} variant="soft">
                  {modeInfo.text}
                </Badge>

                <Badge size="2" color="violet" variant="soft">
                  {contestMeta.duration} minutes
                </Badge>
              </Flex>
            </Flex>
          )}

          {error && (
            <Card
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "1.5rem",
                maxWidth: "600px",
              }}
            >
              <Flex direction="column" align="center" gap="3">
                <Text
                  size="3"
                  weight="bold"
                  style={{ color: "#ef4444", textAlign: "center" }}
                >
                  {error}
                </Text>
                <Button
                  size="2"
                  onClick={() => navigate("/")}
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    cursor: "pointer",
                  }}
                >
                  Go Back to Home
                </Button>
              </Flex>
            </Card>
          )}
        </Flex>

        {/* Participants Section - Hidden when there's an error */}
        {!error && (
          <Box
            className="hero-card"
            style={{
              width: "100%",
              maxWidth: "900px",
              margin: "0 auto",
              background: "rgba(35, 54, 85, 0.35)",
              borderRadius: "2rem",
              boxShadow:
                "0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(49, 84, 130, 0.4)",
              padding: "2rem",
              position: "relative",
            }}
          >
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Heading size="5" style={{ color: "#e2e8f0", fontWeight: 700 }}>
                  <PersonIcon
                    style={{ display: "inline", marginRight: "0.5rem" }}
                  />
                  Participants ({participants.length}
                  {modeInfo.limit ? `/${modeInfo.limit}` : ""})
                </Heading>

                {modeInfo.limit && participants.length >= modeInfo.limit && (
                  <Badge size="2" color="green" variant="soft">
                    <CheckCircledIcon /> Ready to Start
                  </Badge>
                )}
              </Flex>

              {participants.length === 0 ? (
                <Card
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    padding: "3rem 2rem",
                    textAlign: "center",
                  }}
                >
                  <Text
                    size="3"
                    style={{
                      color: "rgba(226, 232, 240, 0.95)",
                      fontWeight: 500,
                    }}
                  >
                    Waiting for players to join...
                  </Text>
                  <Text
                    size="2"
                    style={{
                      color: "rgba(226, 232, 240, 0.8)",
                      marginTop: "0.5rem",
                    }}
                  >
                    Share the contest code with others
                  </Text>
                </Card>
              ) : (
                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                  {participants.map((participant, index) => (
                    <Card
                      key={participant.userId}
                      className="feature-card"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        backdropFilter: "blur(10px)",
                        padding: "1rem",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Flex align="center" gap="3">
                        <Avatar
                          size="3"
                          src={participant.profilePicture}
                          fallback={participant.name.charAt(0).toUpperCase()}
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea, #764ba2)",
                          }}
                        />
                        <Flex direction="column" style={{ flex: 1 }}>
                          <Text
                            size="3"
                            weight="medium"
                            style={{ color: "#e2e8f0", fontWeight: 600 }}
                          >
                            {participant.name}
                          </Text>
                          {index === 0 && (
                            <Badge
                              size="1"
                              color="violet"
                              variant="soft"
                              style={{ width: "fit-content" }}
                            >
                              Admin
                            </Badge>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Grid>
              )}
            </Flex>
          </Box>
        )}

        {/* Admin Controls - Hidden when there's an error */}
        {!error && isAdmin && (
          <Flex justify="center" mt="6">
            <Button
              size="4"
              disabled={!canStart || !connected}
              onClick={handleStartContest}
              style={{
                background: canStart
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "rgba(100, 100, 100, 0.3)",
                cursor: canStart && connected ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: "1.1rem",
                padding: "1.5rem 3rem",
                boxShadow: canStart
                  ? "0 8px 24px rgba(16, 185, 129, 0.4)"
                  : "none",
              }}
            >
              <RocketIcon width={20} height={20} />
              {canStart
                ? "Start Contest"
                : `Waiting for ${
                    modeInfo.limit ? modeInfo.limit - participants.length : 1
                  } more player(s)`}
            </Button>
          </Flex>
        )}

        {!error && !isAdmin && (
          <Card
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              padding: "1.5rem",
              maxWidth: "600px",
              margin: "2rem auto 0",
              textAlign: "center",
            }}
          >
            <Text size="3" style={{ color: "rgba(226, 232, 240, 0.9)" }}>
              <ClockIcon style={{ display: "inline", marginRight: "0.5rem" }} />
              Waiting for admin to start the contest...
            </Text>
          </Card>
        )}
      </Container>

      {/* Footer */}
      <Box
        className="footer"
        style={{
          width: "100%",
          marginTop: "auto",
          padding: "1rem",
          textAlign: "center",
          backdropFilter: "blur(16px)",
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.6))",
          borderTop: "1px solid rgba(99, 102, 241, 0.15)",
          position: "relative",
        }}
      >
        <Flex direction="column" align="center" gap="1">
          <Text
            size="2"
            weight="medium"
            style={{ color: "rgba(226, 232, 240, 0.9)" }}
          >
            MindMuse
          </Text>
          <Text
            size="1"
            style={{ color: "rgba(148, 163, 184, 0.7)", fontSize: "0.75rem" }}
          >
            Unlock Your Curiosity
          </Text>
          <Text
            size="1"
            style={{
              color: "rgba(148, 163, 184, 0.5)",
              fontSize: "0.7rem",
            }}
          >
            &copy; {new Date().getFullYear()} MindMuse. All rights reserved.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
