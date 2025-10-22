import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Theme } from '@radix-ui/themes'
import React, { useEffect, useState } from 'react';
import { validateUser } from './store/authStore.ts';
import LoadingSpinner from './components/LoadingSpinner.tsx';

const RootWrapper: React.FC = () => {
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      await validateUser();
      setIsValidated(true);
    };
    initializeAuth();
  }, []);

  if (!isValidated) {
    return <LoadingSpinner message="" />; 
  }

  return (
    <Theme appearance="dark" accentColor="blue" grayColor="sand" radius="large" scaling="95%">
      <App />
    </Theme>
  );
};

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <RootWrapper />
  </StrictMode>
)
