import Storage from "expo-sqlite/kv-store";

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
} from "@/constants/settings";
import type { Settings, ThemeScheme } from "@/types/settings";

function isThemeScheme(value: unknown): value is ThemeScheme {
  return value === "light" || value === "dark";
}

function parseSettings(raw: string | null): Settings {
  if (raw === null) return DEFAULT_SETTINGS;

  try {
    const data: unknown = JSON.parse(raw);

    if (
      typeof data !== "object" ||
      data === null ||
      !("version" in data) ||
      data.version !== SETTINGS_VERSION ||
      !("theme" in data)
    ) {
      return DEFAULT_SETTINGS;
    }

    const theme = data.theme;

    if (
      typeof theme !== "object" ||
      theme === null ||
      !("useDeviceTheme" in theme) ||
      typeof theme.useDeviceTheme !== "boolean" ||
      !("manualScheme" in theme) ||
      !isThemeScheme(theme.manualScheme)
    ) {
      return DEFAULT_SETTINGS;
    }

    return {
      version: SETTINGS_VERSION,
      theme: {
        useDeviceTheme: theme.useDeviceTheme,
        manualScheme: theme.manualScheme,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function loadSettings(): Settings {
  try {
    return parseSettings(Storage.getItemSync(SETTINGS_STORAGE_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  Storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(() => {
    // 
  });
}
