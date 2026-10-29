import type { SymbolViewProps } from "expo-symbols";

// um único nome chama os ícones SF (do iOS) e Material (do Android)
export const ICONS = {
  wifi: { ios: "wifi", android: "wifi", web: "wifi" },
  wifiOff: { ios: "wifi.slash", android: "wifi_off", web: "wifi_off" },
  activity: { ios: "waveform.path.ecg", android: "monitor_heart", web: "monitor_heart" },
  bell: { ios: "bell", android: "notifications", web: "notifications" },
  mapPin: { ios: "mappin.and.ellipse", android: "location_on", web: "location_on" },
  map: { ios: "map", android: "map", web: "map" },
  shield: { ios: "shield", android: "shield", web: "shield" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  check: { ios: "checkmark", android: "check", web: "check" },
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  arrowRight: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  arrowUpRight: { ios: "arrow.up.right", android: "north_east", web: "north_east" },
  info: { ios: "info.circle", android: "info", web: "info" },
  help: { ios: "questionmark.circle", android: "help", web: "help" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  settings: { ios: "gearshape", android: "settings", web: "settings" },
  history: { ios: "clock.arrow.circlepath", android: "history", web: "history" },
  video: { ios: "video", android: "videocam", web: "videocam" },
  globe: { ios: "globe", android: "language", web: "language" },
  close: { ios: "xmark", android: "close", web: "close" },
} as const satisfies Record<string, SymbolViewProps["name"]>;

export type IconName = keyof typeof ICONS;
