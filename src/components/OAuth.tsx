import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { auth, googleProvider } from '../firebase'; 
import { Button } from "@radix-ui/themes";
import { FcGoogle } from "react-icons/fc";
import { useAuthStore } from '../store/authStore';


const GoogleSignInButton: React.FC = () => {
  const setUser = useAuthStore((state) => state.setUser);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, { idToken }, { withCredentials: true });

      if (response.data.success) {
        setUser({
          _id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          profilePicture: response.data.user.profilePicture,
        });
        console.log('Logged in:', response.data.user);
      } else {
        console.error('Backend auth failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <Button size="3" variant="soft" className="glass card-hover" onClick={handleGoogleSignIn}>
      <FcGoogle />
      Sign in with Google
    </Button>
  );
};

export default GoogleSignInButton;