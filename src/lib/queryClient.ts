import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Universal network status synchronizer for React Query
if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      retry: (failureCount, error) => {
        // Do not retry 4xx errors
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('not found') || msg.includes('JWT') || msg.includes('unauthorized')) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: Platform.OS === 'web',
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
