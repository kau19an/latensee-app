export type ThemeScheme = "light" | "dark";

export interface ThemeSettings {
  useDeviceTheme: boolean;
  manualScheme: ThemeScheme;
}

export interface Settings {
  version: number;
  theme: ThemeSettings;
}
