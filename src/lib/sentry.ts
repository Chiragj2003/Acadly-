/**
 * Sentry Crash Reporting & Error Monitoring (Free Tier)
 * 
 * Safely initialized only when EXPO_PUBLIC_SENTRY_DSN is provided in environment variables.
 * In development or when unconfigured, no-ops gracefully.
 */

import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN || SENTRY_DSN.trim() === '') {
    if (__DEV__) {
      // Sentry DSN not configured in dev; crash reporting disabled
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: __DEV__,
      tracesSampleRate: 0.2, // Free tier friendly
      enableAutoSessionTracking: true,
      environment: process.env.NODE_ENV || 'production',
    });
  } catch (err: unknown) {
    console.warn('Failed to initialize Sentry:', err);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    try {
      Sentry.captureException(error, { extra: context });
    } catch {
      // Fallback
    }
  } else if (__DEV__) {
    console.error('Captured Exception (Sentry unconfigured):', error, context);
  }
}

export { Sentry };
