import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface CardProps {
  tone?: "default" | "tint";
  radius?: "lg" | "xl";
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function Card({
  tone = "default",
  radius = "xl",
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  children,
}: CardProps) {
  const colors = useThemeColors();
  const isTint = tone === "tint";

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      borderRadius: Radius[radius],
      backgroundColor: isTint ? colors.surfaceTint : colors.surface,
      borderColor: isTint ? "transparent" : colors.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        android_ripple={{ color: colors.border }}
        style={cardStyle}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    padding: Spacing.md + 2,
    borderWidth: 1,
    overflow: "hidden",
  },
});
