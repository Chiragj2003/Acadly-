import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/context/AuthContext';
import { InstituteProvider } from '@/context/InstituteContext';
import { ChildProvider } from '@/context/ChildContext';
import { AcademicProvider } from '@/context/AcademicContext';
import { FeeNotificationProvider } from '@/context/FeeNotificationContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <InstituteProvider>
        <ChildProvider>
          <AcademicProvider>
            <FeeNotificationProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <AnimatedSplashOverlay />
                <AppTabs />
              </ThemeProvider>
            </FeeNotificationProvider>
          </AcademicProvider>
        </ChildProvider>
      </InstituteProvider>
    </AuthProvider>
  );
}
