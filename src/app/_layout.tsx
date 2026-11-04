import '../global.css';
import '@/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { InstituteProvider } from '@/context/InstituteContext';
import { ChildProvider } from '@/context/ChildContext';
import { AcademicProvider } from '@/context/AcademicContext';
import { FeeNotificationProvider } from '@/context/FeeNotificationContext';
import { ChatProvider } from '@/context/ChatContext';

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
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <InstituteProvider>
        <ChildProvider>
          <AcademicProvider>
            <FeeNotificationProvider>
              <ChatProvider>
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
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
          </AcademicProvider>
        </ChildProvider>
      </InstituteProvider>
    </AuthProvider>
  );
}
