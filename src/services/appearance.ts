import { Appearance } from "react-native";

import type { ThemeSettings } from "@/types/settings";

export function applyThemeOverride(theme: ThemeSettings): void {
  Appearance.setColorScheme(theme.useDeviceTheme ? "unspecified" : theme.manualScheme);
}
