import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/constants/icons";
import { Radius } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

type TileSize = "sm" | "lg";
type TileTone = "tint" | "primary";

interface IconTileProps {
  icon: IconName;
  size?: TileSize;
  tone?: TileTone;
}

const TILE: Record<TileSize, { box: number; radius: number; icon: number }> = {
  sm: { box: 32, radius: Radius.xs, icon: 18 },
  lg: { box: 56, radius: Radius.md, icon: 30 },
};

export function IconTile({ icon, size = "sm", tone = "tint" }: IconTileProps) {
  const colors = useThemeColors();
  const { box, radius, icon: iconSize } = TILE[size];
  const isPrimary = tone === "primary";

  return (
    <View
      style={[
        styles.tile,
        {
          width: box,
          height: box,
          borderRadius: radius,
          backgroundColor: isPrimary ? colors.primary : colors.surfaceTint,
        },
      ]}
    >
      <AppIcon
        name={icon}
        size={iconSize}
        color={isPrimary ? colors.onPrimary : colors.primaryText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
});
