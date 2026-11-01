import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from '@/context/AuthContext';
import { InstituteProvider } from '@/context/InstituteContext';
import { ChildProvider } from '@/context/ChildContext';
import { AcademicProvider } from '@/context/AcademicContext';
import { FeeNotificationProvider } from '@/context/FeeNotificationContext';

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
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="student" />
                <Stack.Screen name="teacher" />
                <Stack.Screen name="parent" />
                <Stack.Screen name="admin" />
              </Stack>
            </FeeNotificationProvider>
          </AcademicProvider>
        </ChildProvider>
      </InstituteProvider>
    </AuthProvider>
  );
}
