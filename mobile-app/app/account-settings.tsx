import { StyleSheet, Pressable, TouchableOpacity, View } from "react-native";
import crossPlatformAlert from "@/utils/crossPlatformAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { useLanguageStore, SUPPORTED_LANGUAGES } from "@/stores/languageStore";
import React from "react";

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const [showLangPicker, setShowLangPicker] = React.useState(false);

  const handleDeleteAccount = () => {
    crossPlatformAlert(t("settings.deleteAccount"), t("settings.deleteAccountConfirmMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
        onPress: () => {},
      },
      {
        text: t("settings.deleteAccount"),
        style: "destructive",
        onPress: () => {
          router.replace("/delete-account");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <ThemeText variant="body1" style={[styles.headerTitle, { fontWeight: "600" }]}>
            {t("settings.account")}
          </ThemeText>
          <ThemeView style={styles.headerSpacer} />
        </ThemeView>

        {/* Language selection */}
        <ThemeView
          style={[styles.section, { backgroundColor: theme.colors.background.paper }]}
          rounded="md"
        >
          <Pressable style={styles.settingItem} onPress={() => setShowLangPicker((s) => !s)}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="language-outline" size={22} color={theme.colors.primary.main} />
              <ThemeText style={styles.settingText}>
                {(() => {
                  const label = t("settings.language");
                  return label === "settings.language" ? "Idioma" : label;
                })()}
              </ThemeText>
            </ThemeView>
            <ThemeText variant="body2" style={{ color: theme.colors.text.secondary }}>
              {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.label ??
                selectedLanguage}
            </ThemeText>
          </Pressable>

          {showLangPicker && (
            <View
              style={{
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[styles.settingItem, { paddingLeft: 48 }]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLangPicker(false);
                  }}
                >
                  <ThemeText style={styles.settingText}>{lang.label}</ThemeText>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary.main} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </ThemeView>

        <ThemeView
          style={[
            styles.section,
            styles.dangerSection,
            { backgroundColor: theme.colors.background.paper },
          ]}
          rounded="md"
        >
          <Pressable
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            onPress={handleDeleteAccount}
          >
            <ThemeView style={styles.settingContent}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.error.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.error.main }]}>
                {t("settings.deleteAccount")}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {},
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    overflow: "hidden",
    marginBottom: 16,
  },
  dangerSection: {},
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
