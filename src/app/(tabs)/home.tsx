import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";
import { HOME_TEXT } from "@/constants/app-content";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function HomeScreen() {
  const colors = useThemeColors();

  return (
    <Screen title={HOME_TEXT.title}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {HOME_TEXT.placeholder}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
