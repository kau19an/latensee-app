import type { Settings } from "@/types/settings";

// Armazenamento das configurações definidas pelo usuário
export const SETTINGS_STORAGE_KEY = "latensee.settings";
export const SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  theme: { useDeviceTheme: true, manualScheme: "light" },
};
