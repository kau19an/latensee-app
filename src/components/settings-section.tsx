import { Children, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface SettingsSectionProps {
  title: string;
  footer?: string;
  children: ReactNode;
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const colors = useThemeColors();
  const rows = Children.toArray(children);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            {row}
          </View>
        ))}
      </View>

      {footer ? (
        <Text style={[styles.footer, { color: colors.textSecondary }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: Spacing.sm,
  },
  group: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
});
