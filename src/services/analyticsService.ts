import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Create user contest analytics
 * @param userId - User ID
 * @param contestType - 'normal' or 'nptel'
 * @param mode - 'duel', 'practice', or 'multiplayer'
 */
export const createUserContestAnalytics = async (
  userId: string,
  contestType: 'normal' | 'nptel',
  mode: 'duel' | 'practice' | 'multiplayer'
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analytics/user-contest-analytics`,
      { userId, contestType, mode },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating user contest analytics:', error);
    throw error;
  }
};

/**
 * Create user NPTEL analytics
 * @param userId - User ID
 * @param startCnt - Number of NPTEL practices started
 * @param endCnt - Number of NPTEL practices completed
 */
export const createUserNptelAnalytics = async (
  userId: string,
  startCnt: number = 0,
  endCnt: number = 0
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analytics/user-nptel-analytics`,
      { userId, startCnt, endCnt },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating user NPTEL analytics:', error);
    throw error;
  }
};

/**
 * Create daily user analytics
 * @param userId - User ID
 * @param timestamp - Unix timestamp
 * @param contestType - Optional: 'normal' or 'nptel'
 * @param mode - Optional: 'duel', 'practice', or 'multiplayer'
 * @param startCnt - Number of NPTEL practices started
 * @param endCnt - Number of NPTEL practices completed
 */
export const createDailyUserAnalytics = async (
  userId: string,
  timestamp: number,
  contestType?: 'normal' | 'nptel',
  mode?: 'duel' | 'practice' | 'multiplayer',
  startCnt: number = 0,
  endCnt: number = 0
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analytics/daily-user-analytics`,
      { userId, timestamp, contestType, mode, startCnt, endCnt },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating daily user analytics:', error);
    throw error;
  }
};

/**
 * Create contest analytics
 * @param contestId - Contest ID
 * @param timestamp - Unix timestamp
 * @param topic - Optional: Contest topic
 */
export const createContestAnalytics = async (
  contestId: string,
  timestamp: number,
  topic?: string
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analytics/contest-analytics`,
      { contestId, timestamp, topic },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating contest analytics:', error);
    throw error;
  }
};

/**
 * Create NPTEL practice analytics
 * @param subject - Subject/Course code
 * @param timestamp - Unix timestamp
 */
export const createNptelPracticeAnalytics = async (
  subject: string,
  timestamp: number
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analytics/nptel-practice-analytics`,
      { subject, timestamp },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating NPTEL practice analytics:', error);
    throw error;
  }
};

// ==================== GET METHODS ====================

/**
 * Get daily active users
 * @param timestamp - Unix timestamp
 */
export const getDailyActiveUsers = async (timestamp: number) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/analytics/daily-active-users/${timestamp}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching daily active users:', error);
    throw error;
  }
};

/**
 * Get user analytics
 * @param userId - User ID
 */
export const getUserAnalytics = async (userId: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/analytics/user-analytics/${userId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    throw error;
  }
};

/**
 * Get contest analytics
 * @param startTimestamp - Optional: Start timestamp
 * @param endTimestamp - Optional: End timestamp
 * @param limit - Optional: Limit number of results (default: 5)
 */
export const getContestAnalytics = async (
  startTimestamp?: number,
  endTimestamp?: number,
  limit: number = 5
) => {
  try {
    const params = new URLSearchParams();
    if (startTimestamp) params.append('startTimestamp', startTimestamp.toString());
    if (endTimestamp) params.append('endTimestamp', endTimestamp.toString());
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${API_URL}/api/analytics/contest-analytics/dummy?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contest analytics:', error);
    throw error;
  }
};

/**
 * Get NPTEL practice analytics
 * @param startTimestamp - Optional: Start timestamp
 * @param endTimestamp - Optional: End timestamp
 * @param groupBy - Optional: 'subject' or 'date' (default: 'subject')
 * @param limit - Optional: Limit number of results (default: 5)
 */
export const getNptelPracticeAnalytics = async (
  startTimestamp?: number,
  endTimestamp?: number,
  groupBy: 'subject' | 'date' = 'subject',
  limit: number = 5
) => {
  try {
    const params = new URLSearchParams();
    if (startTimestamp) params.append('startTimestamp', startTimestamp.toString());
    if (endTimestamp) params.append('endTimestamp', endTimestamp.toString());
    params.append('groupBy', groupBy);
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${API_URL}/api/analytics/nptel-practice-analytics/dummy?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching NPTEL practice analytics:', error);
    throw error;
  }
};
