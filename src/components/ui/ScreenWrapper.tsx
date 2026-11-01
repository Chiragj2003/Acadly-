import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type ScrollViewProps,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBar, type HeaderBarProps } from './HeaderBar';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  headerProps?: HeaderBarProps;
  scrollable?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  contentContainerClassName?: string;
  className?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  headerProps,
  scrollable = true,
  refreshControl,
  contentContainerClassName = 'px-4 py-4 gap-4',
  className = '',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-surface ${className}`}
      style={{
        paddingTop: headerProps ? insets.top : insets.top,
        paddingBottom: insets.bottom,
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
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 ${contentContainerClassName}`}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};
