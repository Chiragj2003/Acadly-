import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBar, type HeaderBarProps } from './HeaderBar';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  headerProps?: HeaderBarProps;
  footer?: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
  withBottomInset?: boolean;
  statusBarStyle?: 'dark' | 'light';
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  headerProps,
  footer,
  scrollable = true,
  keyboardAvoiding = true,
  refreshControl,
  contentContainerClassName = 'px-4 py-4 gap-4',
  contentContainerStyle,
  className = '',
  withBottomInset = true,
  statusBarStyle = 'dark',
}) => {
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  // When footer is present, it handles its own bottom padding and safe area.
  const applyBottomInset = !footer && withBottomInset;

  // Header background continuity for status bar area on modern iOS devices
  // Soft Desk: the header sits on the same paper ground as the page.
  const headerBgColor = colors.backgroundSecondary;
  const activeStatusBarStyle = statusBarStyle || (isDark ? 'light' : 'dark');

  const bodyContent = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={[
        // Floating tab bar is ~72px tall plus its bottom offset; leave room so the last row clears it.
        footer ? { paddingBottom: 140 + insets.bottom } : { paddingBottom: Math.max(32, insets.bottom + 16) },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className={`flex-1 ${contentContainerClassName}`}
      style={[
        footer ? { paddingBottom: 120 } : { paddingBottom: Math.max(32, insets.bottom + 16) },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View
      className={`flex-1 ${className}`}
      style={{
        backgroundColor: colors.backgroundSecondary,
        paddingBottom: applyBottomInset ? insets.bottom : 0,
        alignItems: 'center',
      }}
    >
      <StatusBar style={activeStatusBarStyle} />

      <View
        className="flex-1 w-full max-w-2xl"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        {/* Top Safe Area & Header Zone */}
        {headerProps ? (
          <View style={{ paddingTop: insets.top, backgroundColor: headerBgColor }}>
            <HeaderBar {...headerProps} />
          </View>
        ) : (
          <View style={{ paddingTop: insets.top }} />
        )}

        {/* Content Area with optional Keyboard Avoiding */}
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
            {bodyContent}
          </KeyboardAvoidingView>
        ) : (
          bodyContent
        )}

        {/* Persistent Docked Footer (e.g. Bottom Tab Bar) */}
        {footer}
      </View>
    </View>
  );
};
