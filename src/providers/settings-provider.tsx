import { createContext, useState, type ReactNode } from "react";

import { applyThemeMode } from "@/services/appearance";
import { loadSettings, saveSettings } from "@/services/settings-storage";
import type { Settings, ThemeMode } from "@/types/settings";

const initialSettings = loadSettings();
applyThemeMode(initialSettings.themeMode);

interface SettingsContextValue {
  settings: Settings;
  setThemeMode: (mode: ThemeMode) => void;
  setModelId: (modelId: string) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  function update(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  function setThemeMode(themeMode: ThemeMode) {
    update({ ...settings, themeMode });
    applyThemeMode(themeMode);
  }

  function setModelId(modelId: string) {
    update({ ...settings, modelId });
  }

  return (
    <SettingsContext.Provider value={{ settings, setThemeMode, setModelId }}>
      {children}
    </SettingsContext.Provider>
  );
}
