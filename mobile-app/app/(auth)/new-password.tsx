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
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { useTheme } from "@/theme";
import { useAuthStore } from "@/stores/authStore";
import { ThemeText, ThemeView } from "@/components";
import { Input } from "@/components/ui/TextInput/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/provider/AlertProvider";
import { AlertPresets } from "@/utils/alert";

interface LoginFormData {
  password: string;
  confirmpassword: string;
}

function NewPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { resetPassword, isLoading } = useAuthStore();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { control, handleSubmit, getValues } = useForm<LoginFormData>({
    defaultValues: {
      password: "",
      confirmpassword: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (!token) throw new Error("Missing verification token");
      await resetPassword({ token, password: data.password });
      alert.show(AlertPresets.success("Password Reset", "Your password has been updated."));
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Login failed", err);
      alert.show(
        AlertPresets.error(
          "Reset Failed",
          err instanceof Error ? err.message : "An error occurred",
        ),
      );
    }
  };

  // const navigateToSignUp = () => {
  //   router.push("/(auth)/signup");
  // };

  const navigateToForgetPassword = () => {
    router.push("/(auth)/login");
  };

  const dynamicStyles: {
    container: ViewStyle;
    logoCircle: ViewStyle;
    logoHeart: ViewStyle;
    subtitle: TextStyle;
    inputError: ViewStyle;
    errorText: TextStyle;
    forgotPasswordText: TextStyle;
    signInButton: ViewStyle;
    signInButtonText: TextStyle;
    signUpLinkText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary.main,
      justifyContent: "center",
      alignItems: "center",
      padding: 15,
    },
    logoHeart: {
      width: 30,
      height: 30,
      backgroundColor: theme.colors.primary.light,
      borderRadius: 15,
    },
    subtitle: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "400" as const,
      color: theme.colors.text.disabled,
      marginBottom: 16,
    },
    inputError: {
      borderColor: theme.colors.error.main,
    },
    errorText: {
      color: theme.colors.error.main,
      fontSize: 12,
      marginTop: 4,
    },
    forgotPasswordText: {
      color: theme.colors.primary.main,
      fontSize: 14,
    },
    signInButton: {
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
    signInButtonText: {
      color: theme.colors.white,
      fontSize: 18,
      fontWeight: "600" as const,
    },
    signUpLinkText: {
      color: theme.colors.primary.main,
      fontSize: 16,
      fontWeight: "600" as const,
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
              {t("auth.newpassword.title")}
            </ThemeText>
          </ThemeView>

          <ThemeView style={styles.formContainer}>
            <Input
              control={control}
              name="password"
              rules={{
                required: t("errors.validation.password.required"),
                minLength: {
                  value: 8,
                  message: t("errors.validation.password.minLength"),
                },
              }}
              placeholder={t("auth.newpassword.password")}
              secureTextEntry
              style={styles.input}
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="go"
              autoComplete="current-password"
              textContentType="password"
            />

            <Input
              control={control}
              name="confirmpassword"
              rules={{
                required: t("errors.validation.confirmPassword.required"),
                validate: (value: string) => {
                  const password = getValues("password");
                  return value === password || t("errors.validation.confirmPassword.mismatch");
                },
              }}
              placeholder={t("auth.newpassword.confirmPassword")}
              secureTextEntry
              // icon={<SvgIcon name="key-renter" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="go"
              autoComplete="new-password"
              textContentType="newPassword"
            />

            <Button
              title={t("auth.newpassword.button")}
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signInButton}
              rightIcon={null}
              loading={isLoading}
              disabled={isLoading}
            />
          </ThemeView>

          {/* <ThemeView style={styles.signUpContainer}>
            <ThemeText style={styles.signUpText}>{t("auth.newpassword.noAccount")} </ThemeText>
            <TouchableOpacity onPress={navigateToSignUp}>
              <ThemeText style={dynamicStyles.signUpLinkText}>{t("auth.newpassword.signUp")}</ThemeText>
            </TouchableOpacity>
          </ThemeView> */}

          <ThemeView style={styles.signUpContainer}>
            <TouchableOpacity onPress={navigateToForgetPassword}>
              <ThemeText
                color={theme.mode === "dark" ? "#ffffff9f" : "#00000080"}
                style={styles.signUpText}
              >
                {t("auth.newpassword.help")}{" "}
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
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  formContainer: {
    marginTop: 30,
  },
  input: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signUpText: {
    fontSize: 16,
  },
});

export default NewPasswordScreen;
