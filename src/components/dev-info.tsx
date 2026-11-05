import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface DevInfoProps {
  title: string;
  children: ReactNode;
}

export function DevInfo({ title, children }: DevInfoProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: Spacing.sm,
  },
  content: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
});
