import { NativeTabs } from "expo-router/unstable-native-tabs";

import { TABS_TEXT } from "@/constants/app-content";
import { FontFamily } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function TabsLayout() {
  const colors = useThemeColors();

  const labelBase = { fontFamily: FontFamily.medium, fontSize: 11 } as const;

  return (
    <NativeTabs
      tintColor={colors.primaryText}
      iconColor={{ default: colors.textSecondary, selected: colors.primaryText }}
      labelStyle={{
        default: { ...labelBase, color: colors.textSecondary },
        selected: { ...labelBase, color: colors.primaryText },
      }}
      backgroundColor={colors.surface}
      indicatorColor={colors.surfaceTintStrong}
      rippleColor={colors.surfaceTint}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>{TABS_TEXT.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="alerts">
        <NativeTabs.Trigger.Label>{TABS_TEXT.alerts}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bell", selected: "bell.fill" }}
          md="notifications"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Label>{TABS_TEXT.map}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{TABS_TEXT.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
