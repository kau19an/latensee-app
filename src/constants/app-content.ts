import type { ThemeMode } from "@/types/settings";
import type { SelectOption } from "@/types/ui";

// Nome das opções na navegação
export const TABS_TEXT = {
  home: "Início",
  alerts: "Alertas",
  map: "Mapa",
  settings: "Config.",
} as const;

// Textos da tela "Início"
export const SCREEN_TEXT = {
  back: "Voltar",
  comingSoon: "Em breve",
  alerts: {
    title: "Alertas",
    description: "Os horários em que a internet na sua região deve oscilar.",
  },
  map: {
    title: "Mapa",
    description: "Onde você está e onde fica o ponto de medição mais próximo.",
  },
  activities: {
    title: "Atividades",
    description:
      "Status da internet para chamadas de vídeo, streaming e mais.",
  },
  privacy: {
    title: "Privacidade",
    description:
      "Como usamos a sua localização e como você pode ajustar essa permissão.",
  },
} as const;

// Textos da tela "Configurações"
export const SETTINGS_TEXT = {
  title: "Configurações",
  appearanceSection: "Aparência",
  theme: { label: "Tema" },
  devInfoTitle: "Informações técnicas",
  apiStatus: {
    prefix: "API:",
    statuses: {
      checking: "Em verificação",
      active: "OK",
      unavailable: "OFF",
    },
  },
} as const;

// Textos dos temas
export const THEME_OPTIONS: readonly SelectOption<ThemeMode>[] = [
  { value: "auto", label: "Automático" },
  { value: "dark", label: "Escuro" },
  { value: "light", label: "Claro" },
];
