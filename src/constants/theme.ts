import type { TextStyle } from "react-native";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceTint: string;
  surfaceTintStrong: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  accent: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: "#FDFBFF",
    surface: "#FFFFFF",
    surfaceTint: "#F6EFFC",
    surfaceTintStrong: "#EDE0F8",
    border: "#E5D4F3",
    text: "#10002B",
    textSecondary: "#71677D",
    primary: "#7B2CBF",
    primaryText: "#7B2CBF",
    accent: "#5A189A",
    onPrimary: "#FFFFFF",
    success: "#067647",
    warning: "#B54708",
    danger: "#D92D20",
  },
  dark: {
    background: "#120A1F",
    surface: "#1C1230",
    surfaceTint: "#261A3D",
    surfaceTintStrong: "#32224F",
    border: "#3A2A57",
    text: "#F6EFFC",
    textSecondary: "#B3A8C4",
    primary: "#7B2CBF",
    primaryText: "#C084FC",
    accent: "#D2A8FF",
    onPrimary: "#FFFFFF",
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
  xl: 32, // side margin
} as const;

export const Radius = {
  xs: 10, // small icon tiles
  sm: 14, // compact buttons
  md: 18, // large icon tiles
  lg: 20, // secondary cards
  xl: 24, // main cards
  pill: 999,
} as const;

export const MIN_TOUCH_TARGET = 48;

export const FontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  monoRegular: "JetBrainsMono_400Regular",
  monoBold: "JetBrainsMono_700Bold",
} as const;

export type TypographyVariant =
  | "title"
  | "heading"
  | "section"
  | "body"
  | "label"
  | "caption"
  | "eyebrow"
  | "metric"
  | "mono";

export const Typography: Record<TypographyVariant, TextStyle> = {
  title: { fontFamily: FontFamily.semibold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: FontFamily.semibold, fontSize: 20, lineHeight: 26 },
  section: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16 },
  eyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metric: { fontFamily: FontFamily.monoBold, fontSize: 32, lineHeight: 38 },
  mono: { fontFamily: FontFamily.monoRegular, fontSize: 12, lineHeight: 16 },
};
