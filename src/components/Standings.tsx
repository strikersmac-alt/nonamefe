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
} from "@radix-ui/themes";
import {
  StarFilledIcon,
  CheckCircledIcon,
  ClockIcon,
  LockClosedIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { io } from "socket.io-client";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import { useAuthStore } from "../store/authStore";
import "../App.css";
import useDocumentTitle from "../hooks/useDocumentTitle";

interface Standing {
  userId: string;
  name: string;
  score: number;
  timeTaken: number;
  attempted: number;
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
  status: string;
}

const formatTime = (ms: number | string | undefined) => {
  const timeValue = typeof ms === "string" ? parseFloat(ms) : ms;

  if (
    timeValue === undefined ||
    timeValue === null ||
    isNaN(timeValue) ||
    timeValue <= 0
  ) {
    return "--:--";
  }

  const totalSeconds = Math.floor(timeValue / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export default function Standings() {
  const navigate = useNavigate();
  const { contestId } = useParams<{ contestId: string }>();
  const location = useLocation();
  const contestMeta = location.state?.contestMeta as ContestMeta;
  const finalScore = location.state?.finalScore as number;
  const fromProfile = location.state?.fromProfile as boolean;

  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [contestInfo, setContestInfo] = useState<{
    isLive: boolean;
    totalParticipants: number;
    capacity: number;
  } | null>(null);
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?._id || "";
  useDocumentTitle("MindMuse - Standings");

  useEffect(() => {
    if (finalScore !== undefined && !fromProfile) {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [finalScore, fromProfile]);

  useEffect(() => {
    let socketInstance: any = null;
    let socketTimeout: number | undefined;

    const initializeStandings = async () => {
      try {
        const infoResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/contest/${contestId}/questions`
        );

        const isLive = infoResponse.data.meta?.isLive;

        setContestInfo({
          isLive: isLive || false,
          totalParticipants: 0,
          capacity: 0,
        });

        if (!isLive || fromProfile) {
          const standingsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/contest/${contestId}/standings`
          );

          if (standingsResponse.data.success) {
            setStandings(standingsResponse.data.standings);
          }
          setLoading(false);
        } else {
          socketInstance = io(`${import.meta.env.VITE_API_URL}`, {
            withCredentials: true,
          });

          socketTimeout = setTimeout(async () => {
            try {
              const restResponse = await axios.get(
                `${
                  import.meta.env.VITE_API_URL
                }/api/contest/${contestId}/standings`
              );
              if (restResponse.data.success && restResponse.data.standings) {
                setStandings(restResponse.data.standings);
              }
              setLoading(false);
            } catch (err) {
              console.error("Timeout REST API fallback failed:", err);
              setLoading(false);
            }
          }, 3000);

          socketInstance.on("connect", () => {
            socketInstance.emit(
              "joinContest",
              contestId,
              async (response: any) => {
                console.log("Join contest response:", response);

                socketInstance.emit(
                  "getStandings",
                  contestId,
                  async (standingsResponse: any) => {
                    clearTimeout(socketTimeout);

                    if (
                      standingsResponse.success &&
                      standingsResponse.standings
                    ) {
                      setStandings(standingsResponse.standings);
                      setLoading(false);
                    } else {
                      try {
                        const restResponse = await axios.get(
                          `${
                            import.meta.env.VITE_API_URL
                          }/api/contest/${contestId}/standings`
                        );
                        if (restResponse.data.success) {
                          setStandings(restResponse.data.standings);
                        }
                      } catch (err) {
                        console.error("REST API fallback failed:", err);
                      }
                      setLoading(false);
                    }
                  }
                );
              }
            );
          });

          socketInstance.on(
            "updateStandings",
            (updatedStandings: Standing[]) => {
              if (updatedStandings && Array.isArray(updatedStandings)) {
                setStandings(updatedStandings);
                setLoading(false);
              }
            }
          );

          socketInstance.on("connect_error", () => {
            setLoading(false);
          });
        }
      } catch (error) {
        console.error("Error initializing standings:", error);
        setLoading(false);
      }
    };

    initializeStandings();

    return () => {
      if (socketTimeout) {
        clearTimeout(socketTimeout);
      }
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [contestId, fromProfile]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
      case 2:
        return "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)";
      case 3:
        return "linear-gradient(135deg, #d97706 0%, #b45309 100%)";
      default:
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }
  };

  // Compute user's own standing for "Your Score" display (works for both live and final)
  const userStanding = standings.find((s) => s.userId === currentUserId);
  const yourScore = userStanding?.score ?? finalScore ?? 0;
  const yourAttempted = userStanding?.attempted ?? 0;

  if (loading) {
    return <LoadingSpinner message="Loading standings..." />;
  }

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
      }}
    >
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Container
        size="3"
        px={{ initial: "4", sm: "5", md: "6" }}
        pt={{ initial: "4", md: "5" }}
        pb="6"
        style={{ flex: 1, position: "relative", zIndex: 1 }}
      >
        {/* Header Section */}
        <Flex direction="column" align="center" gap="4" mb="6">
          <Badge
            size="3"
            color={contestInfo?.isLive ? "orange" : "green"}
            variant="soft"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <CheckCircledIcon />
            {contestInfo?.isLive ? "Contest In Progress" : "Contest Completed"}
          </Badge>

          <Heading
            size="9"
            className="glow-text-enhanced"
            style={{
              letterSpacing: "-0.02em",
              fontWeight: 800,
              fontFamily: "Poppins, sans-serif",
              textAlign: "center",
              paddingBottom: "0.4rem",
            }}
          >
            {contestInfo?.isLive ? "Tentative Results" : "Final Standings"}
          </Heading>

          {contestInfo?.isLive && (
            <Text
              size="2"
              style={{ color: "rgba(226, 232, 240, 0.7)", textAlign: "center" }}
            >
              Results will be finalized once all participants complete the
              contest
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

          {userStanding && (
            <Card
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                padding: "1.5rem 2rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <Flex direction="column" align="center" gap="2">
                <Text size="2" style={{ color: "rgba(226, 232, 240, 0.7)" }}>
                  Your Score
                </Text>
                <Text
                  size="8"
                  weight="bold"
                  style={{
                    background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {yourScore}/{yourAttempted} {/* Progress format */}
                </Text>
              </Flex>
            </Card>
          )}
        </Flex>

        {/* Top 3 Winners - FIXED VERSION */}
        {standings.length > 0 ? (
          <Box mb="6" style={{ maxWidth: "600px", margin: "0 auto 2rem" }}>
            <Flex direction="column" gap="2">
              {standings.slice(0, 3).map((standing, idx) => {
                console.log("Standing data:", standing);
                const rank = idx + 1;
                const rankColors = {
                  1: {
                    bg: "rgba(251, 191, 36, 0.15)",
                    border: "rgba(251, 191, 36, 0.6)",
                    text: "rgba(251, 191, 36, 0.95)",
                  },
                  2: {
                    bg: "rgba(148, 163, 184, 0.15)",
                    border: "rgba(148, 163, 184, 0.6)",
                    text: "rgba(148, 163, 184, 0.95)",
                  },
                  3: {
                    bg: "rgba(217, 119, 6, 0.15)",
                    border: "rgba(217, 119, 6, 0.6)",
                    text: "rgba(217, 119, 6, 0.95)",
                  },
                };
                const colors = rankColors[rank as 1 | 2 | 3];

                return (
                  <Card
                    key={standing.userId}
                    style={{
                      background: colors.bg,
                      border: `2px solid ${colors.border}`,
                      backdropFilter: "blur(20px)",
                      padding: "1rem",
                    }}
                  >
                    <Flex align="center" gap="3">
                      <Badge
                        size="2"
                        style={{
                          background: getRankColor(rank),
                          fontWeight: 800,
                          minWidth: "35px",
                        }}
                      >
                        #{rank}
                      </Badge>
                      <Avatar
                        size="3"
                        fallback={standing.name.charAt(0).toUpperCase()}
                        style={{ background: getRankColor(rank) }}
                      />
                      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          size="3"
                          weight="bold"
                          style={{
                            color: "rgba(226, 232, 240, 0.95)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {standing.name}
                        </Text>
                      </Flex>
                      {/* FIXED: Single Flex with score and time */}
                      <Flex
                        direction="column"
                        align="end"
                        style={{
                          minWidth: "50px",
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <Text
                          size="3"
                          weight="bold"
                          style={{
                            background:
                              "linear-gradient(135deg, #60a5fa, #a78bfa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {standing.score}/{standing.attempted}
                        </Text>
                        <Text
                          size="1"
                          style={{
                            color: "rgba(226, 232, 240, 0.7)",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          <ClockIcon width={12} height={12} />
                          {formatTime(Number(standing.timeTaken) || 0)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </Box>
        ) : (
          <Card
            style={{
              background: "rgba(35, 54, 85, 0.35)",
              padding: "2rem",
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto 2rem",
            }}
          >
            <Text size="3" style={{ color: "rgba(226, 232, 240, 0.7)" }}>
              No standings available yet. Waiting for participants to submit
              their answers...
            </Text>
          </Card>
        )}

        {/* Other Participants - FIXED VERSION */}
        {standings.length > 3 && (
          <Box
            className="hero-card"
            style={{
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto",
              background: "rgba(35, 54, 85, 0.35)",
              borderRadius: "2rem",
              boxShadow:
                "0 8px 64px 0 rgba(8, 36, 73, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(49, 84, 130, 0.4)",
              padding: window.innerWidth < 768 ? "1rem" : "1.5rem",
              position: "relative",
            }}
          >
            <div className="card-shine"></div>

            <Heading
              size="5"
              style={{
                color: "rgba(226, 232, 240, 0.95)",
                marginBottom: "1.5rem",
              }}
            >
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
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)"
                        : "linear-gradient(135deg, rgba(15, 29, 49, 0.8) 0%, rgba(20, 35, 60, 0.6) 100%)",
                      border: isCurrentUser
                        ? "2px solid rgba(99, 102, 241, 0.6)"
                        : "1px solid rgba(99, 102, 241, 0.2)",
                      backdropFilter: "blur(10px)",
                      padding: "0.875rem",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Flex align="center" gap="2">
                      <Badge
                        size="2"
                        style={{
                          background: getRankColor(rank),
                          fontWeight: 700,
                          minWidth: "32px",
                          flexShrink: 0,
                        }}
                      >
                        #{rank}
                      </Badge>
                      <Avatar
                        size="2"
                        fallback={standing.name.charAt(0).toUpperCase()}
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea, #764ba2)",
                          flexShrink: 0,
                        }}
                      />
                      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          size="2"
                          weight="bold"
                          style={{
                            color: "rgba(226, 232, 240, 0.95)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {standing.name}
                          {isCurrentUser && (
                            <Badge
                              size="1"
                              color="violet"
                              variant="soft"
                              style={{ marginLeft: "0.5rem" }}
                            >
                              You
                            </Badge>
                          )}
                        </Text>
                      </Flex>
                      {/* FIXED: Added time display */}
                      <Flex
                        direction="column"
                        align="end"
                        style={{
                          minWidth: "50px",
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <Text
                          size="3"
                          weight="bold"
                          style={{
                            background:
                              "linear-gradient(135deg, #60a5fa, #a78bfa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {standing.score}/{standing.attempted}
                        </Text>
                        <Text
                          size="1"
                          style={{
                            color: "rgba(226, 232, 240, 0.7)",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          <ClockIcon width={12} height={12} />
                          {formatTime(Number(standing.timeTaken) || 0)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </Box>
        )}

        {/* Action Buttons */}
        <Flex justify="center" gap="4" mt="6" wrap="wrap" style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          {userStanding ? (
            <Button
              size="3"
              variant="soft"
              onClick={() =>
                navigate(`/contest/${contestId}/summary`, {
                  state: { contestMeta, userScore: finalScore },
                })
              }
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                cursor: "pointer",
                fontWeight: 600,
                flex: 1,
                minWidth: "200px",
                height: "44px",
              }}
            >
              <CheckCircledIcon />
              View Summary
            </Button>
          ) : contestMeta ? (
            <Box
              style={{
                background: contestMeta.status === "end" 
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
                border: contestMeta.status === "end"
                  ? "1.5px solid rgba(239, 68, 68, 0.35)"
                  : "1.5px solid rgba(251, 191, 36, 0.35)",
                borderRadius: "var(--radius-3)",
                backdropFilter: "blur(12px)",
                boxShadow: contestMeta.status === "end"
                  ? "0 4px 16px rgba(239, 68, 68, 0.15)"
                  : "0 4px 16px rgba(251, 191, 36, 0.15)",
                flex: 1,
                minWidth: "200px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flex align="center" gap="2">
                {contestMeta.status === "end" ? (
                  <CrossCircledIcon
                    width="18"
                    height="18"
                    style={{ color: "rgba(252, 165, 165, 0.95)" }}
                  />
                ) : (
                  <LockClosedIcon
                    width="18"
                    height="18"
                    style={{ color: "rgba(253, 224, 71, 0.95)" }}
                  />
                )}
                <Text
                  size="3"
                  weight="medium"
                  style={{
                    color: contestMeta.status === "end"
                      ? "rgba(252, 165, 165, 0.95)"
                      : "rgba(253, 224, 71, 0.95)",
                  }}
                >
                  {contestMeta.status === "end" ? "Contest Has Ended" : "Contest is Full"}
                </Text>
              </Flex>
            </Box>
          ) : null}

          <Button
            size="3"
            onClick={() => navigate("/create-contest")}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              cursor: "pointer",
              fontWeight: 600,
              flex: 1,
              minWidth: "200px",
              height: "44px",
            }}
          >
            <StarFilledIcon />
            Create New Contest
          </Button>
        </Flex>
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
