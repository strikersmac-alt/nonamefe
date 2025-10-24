import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const validateUser = async () => {
  // const baseURL = import.meta.env.VITE_API_URL;
  // console.log(baseURL)
;  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
      withCredentials: true,
    });

    if (response.data.success) {
      useAuthStore.getState().setUser(response.data.user);
      return true;
    } else {
      useAuthStore.getState().logout();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      return false;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    useAuthStore.getState().logout();
    await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
    return false;
  }
};