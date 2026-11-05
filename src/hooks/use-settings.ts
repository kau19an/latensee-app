import { useContext } from "react";

import { SettingsContext } from "@/providers/settings-provider";

export function useSettings() {
  const context = useContext(SettingsContext);

  if (context === null) {
    throw new Error("useSettings must be used inside <SettingsProvider>.");
  }

  return context;
}
