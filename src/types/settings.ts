export type ThemeMode = "auto" | "light" | "dark";

export interface Settings {
  version: number;
  themeMode: ThemeMode;
  modelId: string;
}
