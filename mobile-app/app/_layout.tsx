import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as ThemeProviderNative,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import "react-native-reanimated";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { ThemeProvider } from "@/theme";
import { ThemeStatusBar } from "@/components/primitives";
import i18n from "@/i18n"; // Import i18n configuration
import { I18nextProvider } from "react-i18next";
import { useLanguageStore } from "@/stores/languageStore";
import { setDateLocale } from "@/utils/date";
import { AlertProvider } from "@/provider/AlertProvider";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { queryClient } from "@/hooks/queries/queryClient";
import { AppState, AppStateStatus, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Font configuration for the application.
 * Defines all custom fonts used throughout the app.
 */
const FONTS = {
  // Inter static fonts
  "Inter-Regular": require("../assets/fonts/Inter/Inter_18pt-Regular.ttf"),
  "Inter-Italic": require("../assets/fonts/Inter/Inter_18pt-Italic.ttf"),
  "Inter-Medium": require("../assets/fonts/Inter/Inter_18pt-Medium.ttf"),
  "Inter-MediumItalic": require("../assets/fonts/Inter/Inter_18pt-MediumItalic.ttf"),
  "Inter-SemiBold": require("../assets/fonts/Inter/Inter_18pt-SemiBold.ttf"),
  "Inter-SemiBoldItalic": require("../assets/fonts/Inter/Inter_18pt-SemiBoldItalic.ttf"),
  "Inter-Bold": require("../assets/fonts/Inter/Inter_18pt-Bold.ttf"),
  "Inter-BoldItalic": require("../assets/fonts/Inter/Inter_18pt-BoldItalic.ttf"),

  // Literata static fonts
  "Literata-Regular": require("../assets/fonts/Literata/Literata-Regular.ttf"),
  "Literata-Italic": require("../assets/fonts/Literata/Literata-Italic.ttf"),
  "Literata-SemiBold": require("../assets/fonts/Literata/Literata-SemiBold.ttf"),
  "Literata-SemiBoldItalic": require("../assets/fonts/Literata/Literata-SemiBoldItalic.ttf"),
  "Literata-Bold": require("../assets/fonts/Literata/Literata-Bold.ttf"),
  "Literata-BoldItalic": require("../assets/fonts/Literata/Literata-BoldItalic.ttf"),
  "Literata-ExtraBold": require("../assets/fonts/Literata/Literata_60pt-ExtraBold.ttf"),
  "Literata-ExtraBoldItalic": require("../assets/fonts/Literata/Literata-ExtraBoldItalic.ttf"),
};

/**
 * Navigation stack configuration.
 * Defines the app's navigation structure and screen options.
 * Each screen can have:
 * - name: The route name
 * - redirect: Function to determine if the screen should redirect
 * - options: Additional screen options (e.g., presentation mode)
 */
const STACK_CONFIG = {
  screenOptions: { headerShown: false },
  screens: [
    // Let index render so it can redirect to /teams or /auth-start itself
    { name: "index" },
    { name: "(auth)", redirect: (isAuthenticated: boolean) => isAuthenticated },
    { name: "(tabs)", redirect: (isAuthenticated: boolean) => !isAuthenticated },
    { name: "+not-found", options: { presentation: "modal" as const } },
  ],
};

/*
 * The splash screen remains visible until both fonts are loaded
 * and the database is initialized.
 */
function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const [fontsLoaded] = useFonts(FONTS);

  const isAppReady = fontsLoaded;

  useEffect(() => {
    console.log(
      "fontsLoaded",
      fontsLoaded,
      "isAuthenticated",
      isAuthenticated,
      "isAppReady",
      isAppReady,
    );
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthenticated, isAppReady]);

  // Setup React Query focus manager to refetch queries when app comes to foreground
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isAppReady) {
    return null;
  }

  return <RootLayoutNav />;
}

/**
 * RootLayoutNav component
 * Handles the app's navigation and theme setup.
 * Features:
 * - Theme management (light/dark mode)
 * - Authentication-based routing
 * - Stack navigation setup
 * - Status bar configuration
 */
function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();
  const { mode: themeMode, systemPrefersDark } = useThemeStore();
  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);

  // Calculate active theme
  const activeTheme = themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : themeMode;

  // Memoize theme value to prevent unnecessary re-renders
  const themeValue = useMemo(
    () => (activeTheme === "dark" ? DarkTheme : DefaultTheme),
    [activeTheme],
  );

  // Apply language selection
  useEffect(() => {
    const lng = selectedLanguage || "es";
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng).catch(() => {});
    }
    // Keep date-fns locale in sync
    try {
      setDateLocale(lng);
    } catch {}
  }, [selectedLanguage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProviderNative value={themeValue}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AlertProvider>
                <ThemeStatusBar />
                <Stack {...STACK_CONFIG}>
                  {STACK_CONFIG.screens.map((screen) => (
                    <Stack.Screen
                      key={screen.name}
                      name={screen.name}
                      redirect={screen.redirect?.(isAuthenticated)}
                      options={screen.options}
                    />
                  ))}
                </Stack>
              </AlertProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </I18nextProvider>
        <Toast />
      </ThemeProviderNative>
    </GestureHandlerRootView>
  );
}

/**
 * RootLayout component
 * The main entry point for the app's component tree.
 * Sets up the core providers:
 * - DatabaseProvider: Local database and sync
 */
export default function RootLayout() {
  return <AppContent />;
}
