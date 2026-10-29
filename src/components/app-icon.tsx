import { SymbolView } from "expo-symbols";

import { ICONS, type IconName } from "@/constants/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function AppIcon({ name, size = 20, color }: AppIconProps) {
  const colors = useThemeColors();

  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color ?? colors.text}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
