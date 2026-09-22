import { ThemeText, ThemeView } from "@/components";
import { SvgIcon } from "@/components/SvgIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/TextInput/input";
import { useAlert } from "@/provider/AlertProvider";
import { useTheme } from "@/theme";
import { AlertPresets } from "@/utils/alert";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextStyle, TouchableOpacity, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ForgetPasswordForm {
  email: string;
}

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const router = useRouter();
  const { forgotPassword, isLoading } = useAuthStore();

  const { control, handleSubmit } = useForm<ForgetPasswordForm>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgetPasswordForm) => {
    try {
      await forgotPassword(data.email);
      router.push({
        pathname: "/(auth)/password-reset",
        params: { email: data.email },
      });
    } catch (err) {
      console.error("Forgot password failed", err);
      alert.show(
        AlertPresets.error(
          "Request Failed",
          err instanceof Error ? err.message : "An error occurred",
        ),
      );
    }
  };

  const dynamicStyles: {
    container: ViewStyle;
    content: ViewStyle;
    iconContainer: ViewStyle;
    input: ViewStyle;
    button: ViewStyle;
    backtoLoginContainer: ViewStyle;
    backtoLoginText: TextStyle;
    backtoLoginLinkText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    content: {
      flex: 1,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.black,
      marginBottom: 24,
    },
    input: {
      marginTop: 30,
      marginBottom: 40,
    },
    button: {
      backgroundColor: theme.colors.primary.main,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    backtoLoginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    backtoLoginText: {
      fontSize: 16,
    },
    backtoLoginLinkText: {
      color: theme.colors.text.primary,
      fontSize: 16,
      fontWeight: "600" as const,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ThemeView style={dynamicStyles.content}>
        <ThemeView style={dynamicStyles.iconContainer}>
          <SvgIcon
            name="key"
            size={48}
            color={theme.colors.primary.main}
            stroke={theme.colors.white}
          />
        </ThemeView>

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
          placeholder={t("auth.forgetpassword.email")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={dynamicStyles.input}
          onSubmitEditing={handleSubmit(onSubmit)}
          returnKeyType="next"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Button
          title={t("auth.forgetpassword.button")}
          onPress={handleSubmit(onSubmit)}
          style={dynamicStyles.button}
          rightIcon={null}
          loading={isLoading}
          disabled={isLoading}
        />

        <ThemeView style={dynamicStyles.backtoLoginContainer}>
          <ThemeText
            color={theme.mode === "dark" ? "#ffffff9f" : "#00000080"}
            style={dynamicStyles.backtoLoginText}
          >
            {t("auth.forgetpassword.help")}{" "}
          </ThemeText>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <ThemeText style={dynamicStyles.backtoLoginLinkText}>
              {t("auth.forgetpassword.login")}
            </ThemeText>
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>
    </SafeAreaView>
  );
}
