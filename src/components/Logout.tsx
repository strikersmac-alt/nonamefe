import React from 'react';
import { signOut } from 'firebase/auth';
import axios from 'axios';
import { auth } from '../firebase'; 
import { Button } from "@radix-ui/themes";
import { IoMdLogOut } from "react-icons/io";
import { useAuthStore } from '../store/authStore';

const LogoutButton: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { 
        withCredentials: true 
      });
      logout();
      console.log('Logged out successfully');
      window.location.href = '/'; 
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Button 
      color = "red"
      variant = "solid"
      size = "4"
      onClick={handleLogout}
    >
        <IoMdLogOut />

      Logout
    </Button>
  );
};

export default LogoutButton;