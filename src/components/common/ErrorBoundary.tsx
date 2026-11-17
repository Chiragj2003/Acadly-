import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { captureException } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center p-6">
          <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-sm items-center shadow-lg gap-4">
            <View className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 items-center justify-center">
              <AlertTriangle size={28} color="#E11D48" />
            </View>

            <View className="items-center gap-1">
              <Text className="text-base font-display text-slate-900 dark:text-slate-100 text-center">
                Something unexpected occurred
              </Text>
              <Text className="text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                Acadly encountered an unexpected condition. Your records are safely saved on the server.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Reload and Retry"
              className="bg-blue-600 w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:scale-98 min-h-[44px]"
            >
              <RotateCcw size={16} color="#FFFFFF" />
              <Text className="text-xs font-sans-bold text-white">Retry & Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
