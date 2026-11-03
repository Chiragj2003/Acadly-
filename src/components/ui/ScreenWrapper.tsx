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
  refreshControl?: ScrollViewProps['refreshControl'];
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
  withBottomInset?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  headerProps,
  footer,
  scrollable = true,
  refreshControl,
  contentContainerClassName = 'px-4 py-4 gap-4',
  contentContainerStyle,
  className = '',
  withBottomInset = true,
}) => {
  const insets = useSafeAreaInsets();
  // When footer is present, it handles its own bottom padding and safe area.
  const applyBottomInset = !footer && withBottomInset;

  return (
    <View
      className={`flex-1 bg-surface ${className}`}
      style={{
        paddingTop: insets.top,
        paddingBottom: applyBottomInset ? insets.bottom : 0,
      }}
    >
      <StatusBar style="dark" />

      {headerProps && <HeaderBar {...headerProps} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {scrollable ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={contentContainerClassName}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 ${contentContainerClassName}`} style={contentContainerStyle}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Persistent Docked Footer (e.g. Bottom Tab Bar) */}
      {footer}
    </View>
  );
};
