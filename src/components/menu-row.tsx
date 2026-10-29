import { MenuView } from "@expo/ui/community/menu";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { MIN_TOUCH_TARGET, Spacing } from "@/constants/theme";
import type { SelectOption } from "@/types/ui";

const VALUE_MIN_WIDTH = 112;

interface MenuRowProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function MenuRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: MenuRowProps<T>) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  return (
    <View style={styles.row}>
      <AppText variant="section">{label}</AppText>

      <MenuView
        actions={options.map((option) => ({
          id: option.value,
          title: option.label,
          state: option.value === value ? "on" : "off",
        }))}
        onPressAction={(event) => {
          const chosen = options.find((option) => option.value === event.nativeEvent.event);
          if (chosen) onChange(chosen.value);
        }}
      >
        <View style={styles.trigger}>
          <AppText variant="body" tone="primary" numberOfLines={1}>
            {selectedLabel}
          </AppText>
          <AppText
            variant="body"
            tone="primary"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            ▾
          </AppText>
        </View>
      </MenuView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.xs,
    minWidth: VALUE_MIN_WIDTH,
    minHeight: MIN_TOUCH_TARGET,
  },
});
