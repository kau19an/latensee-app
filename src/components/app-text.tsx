import { Text, type TextProps } from "react-native";

import { Typography, type TypographyVariant } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

type Tone = "default" | "muted" | "primary" | "accent" | "inverse";

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
}

export function AppText({ variant = "body", tone = "default", style, ...rest }: AppTextProps) {
  const colors = useThemeColors();

  const toneColors: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textSecondary,
    primary: colors.primaryText,
    accent: colors.accent,
    inverse: colors.onPrimary,
  };

  return <Text {...rest} style={[Typography[variant], { color: toneColors[tone] }, style]} />;
}
