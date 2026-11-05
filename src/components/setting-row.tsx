import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MIN_TOUCH_TARGET, Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface SettingRowProps {
  title: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  children: ReactNode;
}

export function SettingRow({
  title,
  description,
  badge,
  disabled = false,
  children,
}: SettingRowProps) {
  const colors = useThemeColors();
  const titleColor = disabled ? colors.textSecondary : colors.text;

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <View style={styles.titleLine}>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          {badge ? (
            <Text
              style={[
                styles.badge,
                { color: colors.textSecondary, borderColor: colors.border },
              ]}
            >
              {badge}
            </Text>
          ) : null}
        </View>
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    padding: Spacing.md,
  },
  texts: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
