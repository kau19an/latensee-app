import { StyleSheet, Switch, Text } from "react-native";

import { Screen } from "@/components/screen";
import { SelectField } from "@/components/select-field";
import { SettingRow } from "@/components/setting-row";
import { SETTINGS_TEXT, THEME_OPTIONS } from "@/constants/app-content";
import { Spacing } from "@/constants/theme";
import { useSettings } from "@/hooks/use-settings";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { settings, setUseDeviceTheme, setManualScheme } = useSettings();
  const { useDeviceTheme, manualScheme } = settings.theme;

  return (
    <Screen title={SETTINGS_TEXT.title}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textSecondary }]}
      >
        {SETTINGS_TEXT.appearanceSection}
      </Text>

      <SettingRow title={SETTINGS_TEXT.deviceTheme.title}>
        <Switch
          value={useDeviceTheme}
          onValueChange={setUseDeviceTheme}
          trackColor={{ true: colors.primary }}
          accessibilityLabel={SETTINGS_TEXT.deviceTheme.title}
        />
      </SettingRow>

      {!useDeviceTheme && (
        <SelectField
          label={SETTINGS_TEXT.manualTheme.label}
          options={THEME_OPTIONS}
          value={manualScheme}
          onChange={setManualScheme}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: -Spacing.sm,
  },
});
