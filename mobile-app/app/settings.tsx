import { StyleSheet, Pressable, View } from "react-native";
import crossPlatformAlert from "@/utils/crossPlatformAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useThemeStore, type ThemeMode } from "@/stores/themeStore";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { mode, setThemeMode } = useThemeStore();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const handleLogout = async () => {
    // Show confirmation alert
    crossPlatformAlert(t("settings.logout"), t("settings.logoutConfirmMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.logout"),
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  const performLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // Auth store handles everything: API call, sync stopping, storage clearing, database reset
      await logout();

      // Navigate to login screen
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      crossPlatformAlert(t("common.error"), t("settings.logoutError"), [{ text: t("common.ok") }]);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <View style={[styles.headerRow]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.back", { defaultValue: "Back" })}
            onPress={() => router.back()}
            hitSlop={8}
            style={{ padding: 4, marginRight: 6 }}
          >
            <Ionicons name="chevron-back" size={34} color={theme.colors.text.primary} />
          </Pressable>
          <ThemeText variant="h2" style={styles.header}>
            {t("settings.title")}
          </ThemeText>
        </View>

        {/* Appearance */}

        <ThemeView
          style={[styles.section, { backgroundColor: theme.colors.background.paper }]}
          rounded="md"
        >
          <Pressable
            onPress={() => setAppearanceOpen((v) => !v)}
            style={[
              styles.settingItem,
              { borderBottomColor: appearanceOpen ? theme.colors.divider : "transparent" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("settings.appearance", { defaultValue: "Appearance" })}
          >
            <ThemeView style={styles.settingContent}>
              <Ionicons name="moon-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { paddingVertical: 0 }]}>
                {t("settings.appearance", { defaultValue: "Appearance" })}
              </ThemeText>
            </ThemeView>

            <Ionicons
              name={appearanceOpen ? "chevron-up-outline" : "chevron-forward-outline"}
              size={20}
              color={theme.colors.text.secondary}
            />
          </Pressable>

          {appearanceOpen && (
            <>
              {(
                [
                  {
                    key: "system",
                    label: t("settings.theme.system", { defaultValue: "System" }),
                  },
                  { key: "light", label: t("settings.theme.light", { defaultValue: "Light" }) },
                  { key: "dark", label: t("settings.theme.dark", { defaultValue: "Dark" }) },
                ] as { key: ThemeMode; label: string }[]
              ).map((opt, idx, arr) => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.settingItem,
                    {
                      borderBottomColor:
                        idx === arr.length - 1 ? "transparent" : theme.colors.divider,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.key)}
                >
                  <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                    {opt.label}
                  </ThemeText>
                  {mode === opt.key ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary.main} />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                  )}
                </Pressable>
              ))}
            </>
          )}

          <Pressable
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <ThemeView style={styles.settingContent}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.logout")}
              </ThemeText>
            </ThemeView>
          </Pressable>
        </ThemeView>
      </ThemeView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {},
  headerRow: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  section: {
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
});
