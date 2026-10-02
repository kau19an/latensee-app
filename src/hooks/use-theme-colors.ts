import { useColorScheme } from "react-native";

import { Colors, type ThemeColors } from "@/constants/theme";

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? Colors.dark : Colors.light;
}
