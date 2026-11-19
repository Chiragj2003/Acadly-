import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const PRIVATE_HOST = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

/**
 * In development, a local Supabase URL (localhost or a LAN IP) is pointed at the
 * machine that is running Metro. Hard-coding a LAN IP in .env broke sign-in every
 * time the Wi-Fi network (and so the PC's IP) changed.
 */
export function resolveDevSupabaseUrl(url: string, devHost: string | null | undefined): string {
  try {
    const parsed = new URL(url);
    if (!devHost || !PRIVATE_HOST.test(parsed.hostname) || !PRIVATE_HOST.test(devHost)) return url;
    parsed.hostname = devHost;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

const getDevHost = (): string | null => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  if (Platform?.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : null;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  return hostUri ? hostUri.split(':')[0] : null;
};

const supabaseUrl = configuredUrl ? resolveDevSupabaseUrl(configuredUrl, getDevHost()) : configuredUrl;

/** True when the app talks to a Supabase running on a developer machine. */
export const isLocalSupabase = (() => {
  try {
    return Boolean(supabaseUrl && PRIVATE_HOST.test(new URL(supabaseUrl).hostname));
  } catch {
    return false;
  }
})();

export const supabaseEndpoint = supabaseUrl ?? '';

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
 * iOS Keychain size limit per item is ~2048 bytes.
 * Supabase auth sessions (JWT + refresh token + metadata) regularly exceed 2.5 KB.
 * We chunk values into 1800-byte segments with counter metadata to safely stay below
 * the 2 KB platform threshold while avoiding truncation.
 */
export const CHUNK_SIZE = 1800;

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export const ExpoSecureStoreChunkedAdapter: StorageAdapter = {
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
      // 1. Check if chunked counter exists
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCountStr) {
        const count = parseInt(chunkCountStr, 10);
        if (isNaN(count) || count <= 0) return null;

        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk === null) {
            // Incomplete chunk chain; treat as corrupt/missing
            return null;
          }
          chunks.push(chunk);
        }
        return chunks.join('');
      }

      // 2. Fallback for unchunked legacy items
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
      const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
      const prevCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
      const prevCount = prevCountStr ? parseInt(prevCountStr, 10) : 0;

      // Write all new chunks
      for (let i = 0; i < chunkCount; i++) {
        const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}_${i}`, chunk);
      }

      // Record total chunk count
      await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));

      // Clean up stale higher-indexed chunks if payload shrank
      if (prevCount > chunkCount) {
        for (let i = chunkCount; i < prevCount; i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => {});
        }
      }

      // Clean up legacy unchunked key if it existed
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (e) {
      console.warn('[SecureStore] Failed to persist secure chunked token:', e);
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
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCountStr) {
        const count = parseInt(chunkCountStr, 10);
        await SecureStore.deleteItemAsync(`${key}_chunks`).catch(() => {});
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => {});
        }
      }

      // Also delete unchunked key if present
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (e) {
      console.warn('[SecureStore] Failed to remove secure chunked token:', e);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStoreChunkedAdapter,
    autoRefreshToken: !isTestEnv,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
