import '../global.css';
import '@/i18n';
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { flushAttendanceQueue } from '@/lib/offlineQueue';

import { AuthProvider } from '@/context/AuthContext';
import { ChildProvider } from '@/context/ChildContext';
import { UIProvider } from '@/context/UIContext';
import { FeeNotificationProvider } from '@/context/FeeNotificationContext';
import { ChatProvider } from '@/context/ChatContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Disable strict mode warning for third-party libraries accessing .value during render
try {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
} catch {
  // Graceful fallback if unsupported
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Deep Link handler for OAuth callback & password reset
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url) return;

      try {
        const parsed = Linking.parse(url);

        // 1. Google OAuth / Magic Link Code Exchange
        if (url.includes('auth/callback') || parsed.queryParams?.code) {
          const code = parsed.queryParams?.code;
          if (typeof code === 'string' && isSupabaseConfigured) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
              router.replace('/');
            }
          }
        }

        // 2. Password Reset Deep Link
        if (url.includes('reset-password') || parsed.path === 'reset-password') {
          router.push('/reset-password');
        }
      } catch (err) {
        console.warn('[DeepLink] Error processing URL:', err);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Background / Network Reconnection Offline Attendance Queue Auto-Flush (BUG-017)
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && isSupabaseConfigured) {
        flushAttendanceQueue().catch((err) => {
          console.warn('[OfflineQueue] NetInfo reconnect flush error:', err);
        });
      }
    });

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && isSupabaseConfigured) {
        flushAttendanceQueue().catch((err) => {
          console.warn('[OfflineQueue] AppState foreground flush error:', err);
        });
      }
    });

    return () => {
      unsubscribeNetInfo();
      appStateSub.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChildProvider>
            <UIProvider>
              <FeeNotificationProvider>
                <ChatProvider>
                  <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="reset-password" />
                    <Stack.Screen name="student" />
                    <Stack.Screen name="teacher" />
                    <Stack.Screen name="parent" />
                    <Stack.Screen name="admin" />
                    <Stack.Screen name="community" />
                    <Stack.Screen name="chat" />
                    <Stack.Screen name="verify-students" />
                    <Stack.Screen name="student-detail" />
                    <Stack.Screen name="join-institute" />
                  </Stack>
                </ChatProvider>
              </FeeNotificationProvider>
            </UIProvider>
          </ChildProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
