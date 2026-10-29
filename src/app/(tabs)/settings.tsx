import { ApiStatusLine } from "@/components/api-status-line";
import { DevInfo } from "@/components/dev-info";
import { MenuRow } from "@/components/menu-row";
import { Screen } from "@/components/screen";
import { SettingsSection } from "@/components/settings-section";
import { SETTINGS_TEXT, THEME_OPTIONS } from "@/constants/app-content";
import { useApiHealth } from "@/hooks/use-api-health";
import { useSettings } from "@/hooks/use-settings";

export default function SettingsScreen() {
  const { settings, setThemeMode } = useSettings();
  const { status } = useApiHealth();

  return (
    <Screen title={SETTINGS_TEXT.title}>
      <SettingsSection title={SETTINGS_TEXT.appearanceSection}>
        <MenuRow
          label={SETTINGS_TEXT.theme.label}
          options={THEME_OPTIONS}
          value={settings.themeMode}
          onChange={setThemeMode}
        />
      </SettingsSection>

      <DevInfo title={SETTINGS_TEXT.devInfoTitle}>
        <ApiStatusLine status={status} />
      </DevInfo>
    </Screen>
  );
}
