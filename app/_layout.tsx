import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import "expo-router/entry";
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';

const queryClient = new QueryClient();

// Authentication guard
function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Skip redirection during initial loading
    if (isLoading) return;
    
    console.log('Auth status:', !!user, 'Current path:', segments[0]);

    // If segments[0] is undefined, we are at the root path
    // Redirect authenticated users to the tabs
    if (user && (!segments[0] || segments[0] === undefined)) {
      console.log('Redirecting authenticated user to tabs from root');
      router.replace('/(tabs)/home');
      return;
    }

    // Check if current route is in the auth group
    const isInAuthGroup = segments[0] === '(auth)';

    if (!user && !isInAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      console.log('Redirecting unauthenticated user to login');
      router.replace('/(auth)/login');
    } else if (user && isInAuthGroup) {
      // Redirect to home if authenticated but in auth group
      console.log('Redirecting authenticated user to home from auth group');
      router.replace('/(tabs)/home');
    }
  }, [isLoading, user, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
