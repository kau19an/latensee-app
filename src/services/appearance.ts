import { Appearance } from "react-native";

import type { ThemeMode } from "@/types/settings";

export function applyThemeMode(mode: ThemeMode): void {
  Appearance.setColorScheme(mode === "auto" ? "unspecified" : mode);
}
