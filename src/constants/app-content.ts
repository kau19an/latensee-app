import type { ThemeScheme } from "@/types/settings";
import type { SelectOption } from "@/types/ui";

// Nome das opções na navegação
export const TABS_TEXT = {
  home: "Início",
  settings: "Config.",
} as const;

// Textos da tela "Início"
export const HOME_TEXT = {
  title: "Latensee",
  placeholder:
    "Você verá aqui a previsão da qualidade da internet na sua região.",
} as const;

// Textos da tela "Configurações"
export const SETTINGS_TEXT = {
  title: "Configurações",
  appearanceSection: "Aparência",
  deviceTheme: { title: "Usar tema do dispositivo" },
  manualTheme: { label: "Tema" },
} as const;

// Textos dos temas
export const THEME_OPTIONS: readonly SelectOption<ThemeScheme>[] = [
  { value: "light", label: "Modo claro" },
  { value: "dark", label: "Modo escuro" },
];

// Textos do botão de fechar
export const SELECT_TEXT = {
  close: "Fechar",
  hint: "Toque para escolher uma opção",
} as const;
