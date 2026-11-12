import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Supabase Configuration Error]: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Please verify that your .env file is created and contains valid Supabase project credentials.'
  );
}

export const isSupabaseConfigured = true;

const isTestEnv =
  process.env.NODE_ENV === 'test' || typeof (globalThis as Record<string, unknown>).jest !== 'undefined';

/**
 * Production-grade Secure Storage Adapter:
 * - Uses expo-secure-store on native (iOS & Android) with encrypted keystore/keychain persistence.
 * - Gracefully falls back to browser localStorage on web, or no-op on SSR.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform?.OS === 'web') {
      if (typeof window === 'undefined') return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform?.OS === 'web') {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Safe catch for storage quota or privacy mode errors
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('[SecureStore] Failed to persist secure token:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform?.OS === 'web') {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Safe catch for storage quota or privacy mode errors
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[SecureStore] Failed to remove secure token:', e);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: !isTestEnv,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
