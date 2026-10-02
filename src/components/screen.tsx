import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface ScreenProps {
  title: string;
  children: ReactNode;
}

export function Screen({ title, children }: ScreenProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView
      edges={["top"]}
      collapsable={false}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
});
