import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { useAuthStatus } from '../src/lib/queries';

const queryClient = new QueryClient();

// Authentication guard
function AuthGuard() {
  const { data: authStatus, isLoading } = useAuthStatus();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Skip redirection during initial loading
    if (isLoading) return;
    
    console.log('Auth status:', authStatus?.isAuthenticated, 'Current path:', segments[0]);

    // If segments[0] is undefined, we are at the root path
    // Redirect authenticated users to the tabs
    if (authStatus?.isAuthenticated && (!segments[0] || segments[0] === undefined)) {
      console.log('Redirecting authenticated user to tabs from root');
      router.replace('/(tabs)/home');
      return;
    }

    // Check if current route is in the auth group
    const isInAuthGroup = segments[0] === '(auth)';

    if (!authStatus?.isAuthenticated && !isInAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      console.log('Redirecting unauthenticated user to login');
      router.replace('/(auth)/login');
    } else if (authStatus?.isAuthenticated && isInAuthGroup) {
      // Redirect to home if authenticated and in auth group
      console.log('Redirecting authenticated user from auth group to tabs');
      router.replace('/(tabs)/home');
    }
  }, [authStatus, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
    </QueryClientProvider>
  );
}
