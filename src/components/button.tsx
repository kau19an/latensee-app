import { Pressable, StyleSheet, Text } from "react-native";

import { MIN_TOUCH_TARGET, Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface ButtonProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
}

export function Button({ label, onPress, accessibilityHint, disabled = false }: ButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: colors.onPrimary, foreground: true }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    overflow: "hidden",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
