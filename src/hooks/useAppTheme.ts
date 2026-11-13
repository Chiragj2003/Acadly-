import { useThemeStore, type ThemePreference } from '@/stores/themeStore';
import { DesignTokens, type ColorPalette } from '@/constants/designTokens';

export function useAppTheme() {
  const { preference, effectiveTheme, setPreference } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const colors: ColorPalette = isDark
    ? DesignTokens.colors.dark
    : DesignTokens.colors.light;

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
