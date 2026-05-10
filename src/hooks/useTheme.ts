import { useFlowiStore } from '@/store';
import { COLORS, type Theme } from '@/constants/theme';

export function useTheme(): { dark: boolean; t: Theme } {
  const darkMode = useFlowiStore((s) => s.darkMode);
  return { dark: darkMode, t: darkMode ? COLORS.dark : COLORS.light };
}
