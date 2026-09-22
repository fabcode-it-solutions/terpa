import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from "react-native";
// import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTheme } from "@/theme";
import { useAuthStore } from "@/stores/authStore";
import { ThemeText, ThemeView } from "@/components";
import { Input } from "@/components/ui/TextInput/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/provider/AlertProvider";
import { AlertPresets } from "@/utils/alert";
import zxcvbn from "zxcvbn";

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignUpScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { register, isLoading } = useAuthStore();
  const { control, handleSubmit, setFocus, getValues } = useForm<SignUpFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await register({
        email: data.email,
        password: data.password,
        name: data.name?.trim() ? data.name : undefined,
      });

      // Set flag to show Pocket import prompt for new users
      // Registration success - Zustand will handle navigation via auth state change
    } catch (err) {
      console.error("Registration failed", err);
      alert.show(
        AlertPresets.error(
          "Registration Failed",
          err instanceof Error ? err.message : "An error occurred",
        ),
      );
    }
  };

  const navigateToLogin = () => {
    router.push("/(auth)/login");
  };

  // const openTermsOfService = async () => {
  //   await WebBrowser.openBrowserAsync("https://savewithterpa.com/legal/terms/");
  // };

  // const openPrivacyPolicy = async () => {
  //   await WebBrowser.openBrowserAsync("https://savewithterpa.com/legal/privacy/");
  // };

  const dynamicStyles: {
    container: ViewStyle;
    subtitle: TextStyle;
    signUpButton: ViewStyle;
    loginLinkText: TextStyle;
    legalText: TextStyle;
    legalLink: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    subtitle: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "400" as const,
      color: theme.colors.text.disabled,
      marginBottom: 16,
    },
    signUpButton: {
      backgroundColor: theme.colors.primary.main,
      height: 56,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    loginLinkText: {
      color: theme.colors.primary.main,
      fontSize: 16,
      fontWeight: "600" as const,
    },
    legalText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.text.primary,
      textAlign: "center" as const,
    },
    legalLink: {
      color: theme.colors.primary.main,
      fontSize: 14,
      fontWeight: "500" as const,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemeView style={styles.header}>
            <ThemeText variant="h2" style={styles.title}>
              {t("auth.signup.title")}
            </ThemeText>
          </ThemeView>

          <ThemeView style={styles.formContainer}>
            <Input
              control={control}
              name="name"
              rules={{
                required: t("errors.validation.name.required"),
                minLength: {
                  value: 2,
                  message: t("errors.validation.name.min"),
                },
                pattern: {
                  value: /^[A-Za-z\s'-]+$/,
                  message: t("errors.validation.name.invalid"),
                },
              }}
              placeholder={t("auth.signup.name")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              style={styles.input}
              onSubmitEditing={() => setFocus("email")}
              returnKeyType="next"
              autoComplete="name"
              textContentType="name"
            />
            <Input
              control={control}
              name="email"
              rules={{
                required: t("errors.validation.email.required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("errors.validation.email.invalid"),
                },
              }}
              placeholder={t("auth.signup.email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              style={styles.input}
              onSubmitEditing={() => setFocus("password")}
              returnKeyType="next"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Input
              control={control}
              name="password"
              rules={{
                required: t("errors.validation.password.required"),
                validate: (value: string) => {
                  const result = zxcvbn(value);
                  if (result.score < 2) {
                    return result.feedback.warning || "Password is too weak";
                  }
                  return true;
                },
              }}
              placeholder={t("auth.signup.password")}
              secureTextEntry
              style={styles.input}
              onSubmitEditing={() => setFocus("confirmPassword")}
              returnKeyType="next"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Input
              control={control}
              name="confirmPassword"
              rules={{
                required: t("errors.validation.confirmPassword.required"),
                validate: (value: string) => {
                  const password = getValues("password");
                  return value === password || t("errors.validation.confirmPassword.mismatch");
                },
              }}
              placeholder={t("auth.signup.confirmPassword")}
              secureTextEntry
              // icon={<SvgIcon name="key-renter" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="go"
              autoComplete="new-password"
              textContentType="newPassword"
            />

            <Button
              title={t("auth.signup.button")}
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signUpButton}
              rightIcon={null}
              loading={isLoading}
              disabled={isLoading}
            />
          </ThemeView>

          {/* <ThemeView style={styles.legalContainer}>
            <ThemeText style={dynamicStyles.legalText}>
              {t("auth.signup.legal.agreement")}
            </ThemeText>
            <ThemeView style={styles.legalLinksRow}>
              <TouchableOpacity onPress={openTermsOfService}>
                <ThemeText style={dynamicStyles.legalLink}>
                  {t("auth.signup.legal.termsOfService")}
                </ThemeText>
              </TouchableOpacity>
              <ThemeText style={dynamicStyles.legalText}> {t("auth.signup.legal.and")} </ThemeText>
              <TouchableOpacity onPress={openPrivacyPolicy}>
                <ThemeText style={dynamicStyles.legalLink}>
                  {t("auth.signup.legal.privacyPolicy")}
                </ThemeText>
              </TouchableOpacity>
            </ThemeView>
          </ThemeView> */}

          <ThemeView style={styles.loginContainer}>
            <ThemeText
              color={theme.mode === "dark" ? "#ffffff9f" : "#00000080"}
              style={styles.loginText}
            >
              {t("auth.signup.hasAccount")}{" "}
            </ThemeText>
            <TouchableOpacity onPress={navigateToLogin}>
              <ThemeText
                color={theme.mode === "dark" ? "#ffffff9f" : "#00000080"}
              >{`(${t("auth.signup.logIn")})`}</ThemeText>
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
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 8,
  },
  formContainer: {
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
  legalContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  legalLinksRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
  },
});

export default SignUpScreen;
