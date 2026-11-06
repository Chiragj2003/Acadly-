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
  const insets = useSafeAreaInsets();
  // When footer is present, it handles its own bottom padding and safe area.
  const applyBottomInset = !footer && withBottomInset;

  // Header background continuity for status bar area on modern iOS devices
  const headerBgColor = '#FFFFFF';

  const bodyContent = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={[
        footer ? { paddingBottom: 24 } : null,
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
        footer ? { paddingBottom: 24 } : null,
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View
      className={`flex-1 bg-surface ${className}`}
      style={{
        paddingBottom: applyBottomInset ? insets.bottom : 0,
      }}
    >
      <StatusBar style={statusBarStyle} />

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
  );
};
