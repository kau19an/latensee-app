import { Pressable, StyleSheet } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import type { IconName } from "@/constants/icons";
import { MIN_TOUCH_TARGET, Radius, Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "medium" | "large";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  trailingIcon?: IconName;
  accessibilityHint?: string;
  disabled?: boolean;
}

const SIZES: Record<ButtonSize, { height: number; radius: number; icon: number }> = {
  medium: { height: MIN_TOUCH_TARGET, radius: Radius.sm, icon: 19 },
  large: { height: 60, radius: Radius.lg, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "medium",
  icon,
  trailingIcon,
  accessibilityHint,
  disabled = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const isPrimary = variant === "primary";
  const { height, radius, icon: iconSize } = SIZES[size];
  const contentColor = isPrimary ? colors.onPrimary : colors.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{
        color: isPrimary ? "rgba(255, 255, 255, 0.2)" : colors.border,
        foreground: true,
      }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: height,
          borderRadius: radius,
          backgroundColor: isPrimary ? colors.primary : colors.surfaceTint,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}
    >
      {icon ? <AppIcon name={icon} size={iconSize} color={contentColor} /> : null}
      <AppText variant="section" style={{ color: contentColor }}>
        {label}
      </AppText>
      {trailingIcon ? <AppIcon name={trailingIcon} size={iconSize} color={contentColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
});
