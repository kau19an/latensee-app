import type { Settings } from "@/types/settings";

export const SETTINGS_STORAGE_KEY = "latensee.settings";
export const SETTINGS_VERSION = 2;

export const DEFAULT_MODEL_ID = "model-a";

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  themeMode: "auto",
  modelId: DEFAULT_MODEL_ID,
};
