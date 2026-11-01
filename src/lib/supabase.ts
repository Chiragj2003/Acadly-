import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://cwxuwaljqrqdogsyqhwc.supabase.co';

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_zdo5LS30p0HOoOGS7yUsig_z2ytCYBK';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Universal safe storage adapter preventing SSR window undefined errors
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
