import React, { useEffect, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { ThemeText, ThemeView } from "@/components";
import { Input } from "@/components/ui/TextInput/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/theme";
import { useAuthStore } from "@/stores/authStore";
import { useAlert } from "@/provider/AlertProvider";
import { AlertPresets } from "@/utils/alert";

type TotpFormData = {
  code: string;
};

function TotpScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { control, handleSubmit } = useForm<TotpFormData>({
    defaultValues: { code: "" },
  });

  const {
    verifyTotp,
    isLoading,
    totpEmail,
    totpToken,
    isTotpRequired,
    clearTotp,
    clearError,
    error,
  } = useAuthStore();

  useEffect(() => {
    if (!isTotpRequired || !totpToken) {
      router.replace("/(auth)/login");
    }
  }, [isTotpRequired, totpToken]);

  useEffect(() => {
    clearError();
    return () => {
      clearError();
    };
  }, [clearError]);

  const translateError = (rawMessage: string | null | undefined) => {
    if (!rawMessage) return undefined;
    const normalized = rawMessage.toLowerCase();

    if (normalized.includes("not pending")) {
      return t("auth.totp.noChallenge");
    }
    if (normalized.includes("must be 6 digits")) {
      return t("errors.validation.totp.length");
    }
    if (normalized.includes("is required")) {
      return t("errors.validation.totp.required");
    }

    return rawMessage;
  };

  const dynamicStyles: {
    container: ViewStyle;
    card: ViewStyle;
    emailPill: ViewStyle;
    emailText: TextStyle;
    errorText: TextStyle;
    subtitle: TextStyle;
    changeAccountText: TextStyle;
  } = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
      },
      card: {
        backgroundColor: theme.colors.background.paper,
        borderRadius: 18,
        padding: 20,
        // ...theme.shadows[2],
      },
      emailPill: {
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: theme.colors.primary.light,
        marginTop: 8,
      },
      emailText: {
        color: theme.colors.primary.dark,
        fontWeight: "600",
      },
      errorText: {
        color: theme.colors.error.main,
        marginTop: 8,
      },
      subtitle: {
        color: theme.colors.text.secondary,
      },
      changeAccountText: {
        color: theme.colors.primary.main,
      },
    }),
    [theme],
  );

  const onSubmit = async (form: TotpFormData) => {
    if (isLoading) return;

    try {
      const trimmedCode = form.code.trim();
      await verifyTotp({ code: trimmedCode });
      router.replace("/teams");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.totp.genericError");
      alert.show(AlertPresets.error(t("auth.totp.errorTitle"), message));
    }
  };

  const handleChangeAccount = () => {
    clearTotp();
    clearError();
    router.replace("/(auth)/login");
  };

  const translatedError = translateError(error);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemeText style={styles.title}>{t("auth.totp.title")}</ThemeText>

          <ThemeView style={[styles.card, dynamicStyles.card]}>
            <ThemeText style={[styles.subtitle, dynamicStyles.subtitle]}>
              {t("auth.totp.subtitle")}
            </ThemeText>
            {totpEmail ? (
              <ThemeView style={dynamicStyles.emailPill}>
                <ThemeText variant="caption1" style={dynamicStyles.emailText}>
                  {t("auth.totp.emailLabel", { email: totpEmail })}
                </ThemeText>
              </ThemeView>
            ) : null}

            <Input
              control={control}
              name="code"
              rules={{
                required: t("errors.validation.totp.required"),
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: t("errors.validation.totp.length"),
                },
              }}
              placeholder="auth.totp.codePlaceholder"
              label="auth.totp.codeLabel"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              style={styles.input}
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="done"
            />

            {translatedError ? (
              <ThemeText style={dynamicStyles.errorText}>{translatedError}</ThemeText>
            ) : null}

            <Button
              title={t("auth.totp.button")}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            />

            <TouchableOpacity onPress={handleChangeAccount} style={styles.linkContainer}>
              <ThemeText style={[styles.changeAccountText, dynamicStyles.changeAccountText]}>
                {t("auth.totp.changeAccount")}
              </ThemeText>
            </TouchableOpacity>
          </ThemeView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  card: {
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    marginTop: 24,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 10,
  },
  linkContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  changeAccountText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default TotpScreen;
