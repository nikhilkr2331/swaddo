import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';
import { storage } from './src/lib/api';

const queryClient = new QueryClient();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialization logic, like checking for tokens in MMKV
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
