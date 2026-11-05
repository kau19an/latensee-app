import { StyleSheet, Text, View } from "react-native";

import { BOOT_TEXT } from "@/constants/boot-content";
import { Spacing } from "@/constants/theme";
import { useApiStatusColor } from "@/hooks/use-api-status-color";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { ApiHealthStatus } from "@/types/api";

interface ApiStatusBadgeProps {
  status: ApiHealthStatus;
}

export function ApiStatusBadge({ status }: ApiStatusBadgeProps) {
  const colors = useThemeColors();
  const dotColor = useApiStatusColor(status);

  const label = `${BOOT_TEXT.statusPrefix}: ${BOOT_TEXT.statusLabels[status]}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.dot, { backgroundColor: dotColor }]}
      />
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
