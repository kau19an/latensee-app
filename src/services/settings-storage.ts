import Storage from "expo-sqlite/kv-store";

import {
  DEFAULT_MODEL_ID,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
} from "@/constants/settings";
import type { Settings, ThemeMode } from "@/types/settings";

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "auto" || value === "light" || value === "dark";
}

function isModelId(value: unknown): value is string {
  return typeof value === "string" && /^[\w.-]{1,64}$/.test(value);
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
      !("themeMode" in data) ||
      !isThemeMode(data.themeMode)
    ) {
      return DEFAULT_SETTINGS;
    }

    const modelId = "modelId" in data && isModelId(data.modelId) ? data.modelId : DEFAULT_MODEL_ID;

    return { version: SETTINGS_VERSION, themeMode: data.themeMode, modelId };
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
