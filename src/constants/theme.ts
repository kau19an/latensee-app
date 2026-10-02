export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: "#FFFFFF",
    surface: "#F2F4F7",
    border: "#D0D5DD",
    text: "#101828",
    textSecondary: "#475467",
    primary: "#0B6BCB",
    onPrimary: "#FFFFFF",
    success: "#12B76A",
    warning: "#F79009",
    danger: "#D92D20",
  },
  dark: {
    background: "#0B1220",
    surface: "#1B2433",
    border: "#344054",
    text: "#F2F4F7",
    textSecondary: "#98A2B3",
    primary: "#5AAEFF",
    onPrimary: "#0B1220",
    success: "#32D583",
    warning: "#FDB022",
    danger: "#F97066",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const MIN_TOUCH_TARGET = 48;
