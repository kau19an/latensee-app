import { createContext, useState, type ReactNode } from "react";
import { Appearance } from "react-native";

import { applyThemeOverride } from "@/services/appearance";
import { loadSettings, saveSettings } from "@/services/settings-storage";
import type { Settings, ThemeScheme, ThemeSettings } from "@/types/settings";

const initialSettings = loadSettings();
applyThemeOverride(initialSettings.theme);

interface SettingsContextValue {
  settings: Settings;
  setUseDeviceTheme: (useDeviceTheme: boolean) => void;
  setManualScheme: (scheme: ThemeScheme) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  function updateTheme(theme: ThemeSettings) {
    const next: Settings = { ...settings, theme };
    setSettings(next);
    saveSettings(next);
    applyThemeOverride(theme);
  }

  function setUseDeviceTheme(useDeviceTheme: boolean) {
    const deviceScheme: ThemeScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";

    updateTheme({
      useDeviceTheme,
      manualScheme: useDeviceTheme ? settings.theme.manualScheme : deviceScheme,
    });
  }

  function setManualScheme(manualScheme: ThemeScheme) {
    updateTheme({ useDeviceTheme: false, manualScheme });
  }

  return (
    <SettingsContext.Provider value={{ settings, setUseDeviceTheme, setManualScheme }}>
      {children}
    </SettingsContext.Provider>
  );
}
