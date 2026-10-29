import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SCREEN_TEXT } from "@/constants/app-content";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { useNavigationTheme } from "@/hooks/use-navigation-theme";
import { SettingsProvider } from "@/providers/settings-provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const navigationTheme = useNavigationTheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hide();
  }, [fontsLoaded, fontError]);

  // se as fontes falharem, o app ainda abre com as do sistema
  if (!fontsLoaded && !fontError) return null;

  return (
    <SettingsProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="activities"
            options={{ headerShown: true, title: SCREEN_TEXT.activities.title }}
          >
            <Stack.Screen.BackButton>{SCREEN_TEXT.back}</Stack.Screen.BackButton>
          </Stack.Screen>

          <Stack.Screen name="privacy" options={{ headerShown: true, title: SCREEN_TEXT.privacy.title }}>
            <Stack.Screen.BackButton>{SCREEN_TEXT.back}</Stack.Screen.BackButton>
          </Stack.Screen>
        </Stack>
      </ThemeProvider>
    </SettingsProvider>
  );
}
