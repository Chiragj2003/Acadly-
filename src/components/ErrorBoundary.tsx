import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error locally or send to remote monitoring service (e.g. Sentry / Crashlytics)
    console.error('[RootErrorBoundary] Uncaught application error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container} testID="error-boundary-fallback">
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={36} color="#DC2626" />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred in Acadly. Please try again or restart the application.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.devErrorBox} contentContainerStyle={styles.devErrorContent}>
                <Text style={styles.devErrorTitle}>Debug Info (__DEV__ only):</Text>
                <Text style={styles.devErrorText}>{this.state.error.message}</Text>
                {this.state.error.stack && (
                  <Text style={styles.devStackText}>{this.state.error.stack}</Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EDE9E1',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6E6A63',
    textAlign: 'center',
    marginBottom: 20,
  },
  devErrorBox: {
    maxHeight: 140,
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  devErrorContent: {
    paddingBottom: 4,
  },
  devErrorTitle: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 4,
  },
  devErrorText: {
    color: '#EDE9E1',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  devStackText: {
    color: '#8C877E',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    width: '100%',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
