import { useThemeStore, type ThemePreference } from '@/stores/themeStore';
import { DesignTokens, type ColorPalette } from '@/constants/designTokens';

export function useAppTheme() {
  const { preference, setPreference } = useThemeStore();
  // v1 is light-only (app.json userInterfaceStyle: light). Following the OS here turned
  // every screen background navy on phones / browsers in dark mode while cards stayed light.
  const effectiveTheme = 'light' as 'light' | 'dark';
  const isDark = effectiveTheme === 'dark';
  const colors: ColorPalette = isDark ? DesignTokens.colors.dark : DesignTokens.colors.light;

  const toggleTheme = async () => {
    const nextPref: ThemePreference = isDark ? 'light' : 'dark';
    await setPreference(nextPref);
  };

  return {
    isDark,
    theme: effectiveTheme,
    preference,
    colors,
    tokens: DesignTokens,
    setPreference,
    toggleTheme,
  };
}
