import { useEffect } from "react";
import { router } from "expo-router";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiStatusBadge } from "@/components/api-status-badge";
import { Button } from "@/components/button";
import { BOOT_TEXT, getBootMessage } from "@/constants/boot-content";
import { Spacing } from "@/constants/theme";
import { useApiHealth } from "@/hooks/use-api-health";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function BootScreen() {
  const colors = useThemeColors();
  const { status, elapsedSeconds, retry } = useApiHealth();
  const message = getBootMessage(elapsedSeconds);

  const REDIRECT_DELAY_MS = 800;

  useEffect(() => {
    if (Platform.OS === "ios" && status === "checking") {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message, status]);

  useEffect(() => {
    if (status !== "active") return undefined;

    const timeoutId = setTimeout(() => router.replace("/home"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [status]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ApiStatusBadge status={status} />
      </View>

      <View style={styles.content}>
        {status === "checking" && (
          <>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              accessibilityLabel={BOOT_TEXT.loadingIndicator}
            />
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.message, { color: colors.text }]}
            >
              {message}
            </Text>
            {elapsedSeconds >= 3 && (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {BOOT_TEXT.elapsed(elapsedSeconds)}
              </Text>
            )}
          </>
        )}

        {status === "active" && (
          <>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {BOOT_TEXT.activeTitle}
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {BOOT_TEXT.activeDescription}
            </Text>
          </>
        )}

        {status === "unavailable" && (
          <>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {BOOT_TEXT.unavailableTitle}
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {BOOT_TEXT.unavailableDescription}
            </Text>
            <Button
              label={BOOT_TEXT.retry}
              accessibilityHint={BOOT_TEXT.retryHint}
              onPress={retry}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.md,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  caption: {
    fontSize: 14,
    textAlign: "center",
  },
});
