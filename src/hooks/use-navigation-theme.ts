import { DarkTheme, DefaultTheme } from "expo-router";
import { useColorScheme } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

export function useNavigationTheme() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };
}
