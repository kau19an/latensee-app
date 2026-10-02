import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SELECT_TEXT } from "@/constants/app-content";
import { MIN_TOUCH_TARGET, Spacing } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { SelectOption } from "@/types/ui";

interface SelectFieldProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
}: SelectFieldProps<T>) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  function close() {
    setIsOpen(false);
  }

  function handleSelect(next: T) {
    close();
    if (next !== value) onChange(next);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityHint={SELECT_TEXT.hint}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen(true)}
        android_ripple={{ color: colors.border }}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.fieldText, { color: colors.text }]}>{selectedLabel}</Text>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.symbol, { color: colors.textSecondary }]}
        >
          ▾
        </Text>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={SELECT_TEXT.close}
            onPress={close}
          />

          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + Spacing.md,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[styles.sheetTitle, { color: colors.textSecondary }]}
            >
              {label}
            </Text>

            <View accessibilityRole="radiogroup">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                    onPress={() => handleSelect(option.value)}
                    android_ripple={{ color: colors.border }}
                    style={styles.option}
                  >
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Text
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[styles.symbol, { color: colors.primary }]}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldText: {
    fontSize: 16,
    fontWeight: "600",
  },
  symbol: {
    fontSize: 18,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
  },
});
