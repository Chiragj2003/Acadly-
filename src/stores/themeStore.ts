import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  effectiveTheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => Promise<void>;
  initializeTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@acadly_theme_preference';

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  effectiveTheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',

  setPreference: async (preference: ThemePreference) => {
    let effective: 'light' | 'dark' = 'light';
    if (preference === 'system') {
      effective = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    } else {
      effective = preference;
    }

    set({ preference, effectiveTheme: effective });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Storage error ignored
    }
  },

  initializeTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        let effective: 'light' | 'dark' = 'light';
        if (stored === 'system') {
          effective = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
        } else {
          effective = stored;
        }
        set({ preference: stored, effectiveTheme: effective });
      }
    } catch {
      // Storage error ignored
    }
  },
}));

// Listen to native OS changes if on 'system' preference
Appearance.addChangeListener(({ colorScheme }) => {
  const currentPref = useThemeStore.getState().preference;
  if (currentPref === 'system') {
    useThemeStore.setState({
      effectiveTheme: colorScheme === 'dark' ? 'dark' : 'light',
    });
  }
});
