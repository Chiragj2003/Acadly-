import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from '@/context/AuthContext';
import { InstituteProvider } from '@/context/InstituteContext';
import { ChildProvider } from '@/context/ChildContext';
import { AcademicProvider } from '@/context/AcademicContext';
import { FeeNotificationProvider } from '@/context/FeeNotificationContext';
import { ChatProvider } from '@/context/ChatContext';

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
