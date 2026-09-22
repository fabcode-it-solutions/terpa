import { ThemeText, ThemeView } from "@/components";
import { SvgIcon } from "@/components/SvgIcon";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/theme";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NativeSyntheticEvent,
  SafeAreaView,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useAlert } from "@/provider/AlertProvider";
import { AlertPresets } from "@/utils/alert";

export default function PasswordReset() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState<string | null>("");
  const { verifyResetCode, isLoading } = useAuthStore();
  const alert = useAlert();

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (error) setError(null); // Clear error on input change

    // Move to next input if value is entered
    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    // Move to previous input if backspace is pressed
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async () => {
    if (code.some((digit) => digit === "")) {
      setError("Please enter all digits of the code.");
      return;
    }
    try {
      const joined = code.join("");
      const token = await verifyResetCode({ email, code: joined });
      router.push({ pathname: "/(auth)/new-password", params: { token } });
    } catch (err) {
      console.error("Verify code failed", err);
      alert.show(
        AlertPresets.error(
          "Invalid Code",
          err instanceof Error ? err.message : "An error occurred",
        ),
      );
    }
  };

  const handleResendOtp = async () => {
    try {
      // Reuse forgotPassword to resend code

      const { forgotPassword } = useAuthStore.getState();
      await forgotPassword(email);
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert.show(
        AlertPresets.error(
          "Resend Failed",
          error instanceof Error ? error.message : "An error occurred",
        ),
      );
    }
  };

  const dynamicStyles: {
    container: import("react-native").ViewStyle;
    content: import("react-native").ViewStyle;
    iconContainer: import("react-native").ViewStyle;
    title: import("react-native").TextStyle;
    img_otp_email: import("react-native").ViewStyle;
    subtitle: import("react-native").TextStyle;
    span: import("react-native").TextStyle;
    codeContainer: import("react-native").ViewStyle;
    codeInput: import("react-native").TextStyle;
    button: import("react-native").ViewStyle;
    buttonText: import("react-native").TextStyle;
    codeInputError: import("react-native").ViewStyle;
    errorText: import("react-native").TextStyle;
    resendContainer: import("react-native").ViewStyle;
    resendText: import("react-native").TextStyle;
    resendLink: import("react-native").TextStyle;
    backButton: import("react-native").ViewStyle;
    backButtonText: import("react-native").TextStyle;
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
      backgroundColor: theme.colors.black,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 30,
      fontWeight: "700" as const,
      color: theme.colors.text.primary,
      marginBottom: 8,
      lineHeight: 30,
    },
    img_otp_email: {
      width: 108,
      height: 108,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 0,
      lineHeight: 22,
      fontWeight: "400" as const,
    },
    span: {
      color: theme.colors.text.primary,
      fontWeight: "500",
      lineHeight: 22,
      fontSize: 14,
    },
    codeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 40,
      marginTop: 30,
    },
    codeInput: {
      width: 70,
      height: 70,
      fontWeight: "700" as const,
      backgroundColor: theme.colors.background.default,
      borderRadius: 10,
      fontSize: 30,
      textAlign: "center",
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.text.primary,
    },
    button: {
      width: "100%",
      height: 56,
      backgroundColor: theme.colors.primary.main,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "600" as const,
    },
    codeInputError: {
      borderColor: theme.colors.error.main, // Highlight input borders on error
    },
    errorText: {
      color: theme.colors.error.main,
      fontSize: 14,
      marginTop: -32,
      marginBottom: 20,
      textAlign: "center",
    },
    resendContainer: {
      alignItems: "center",
      marginTop: 0,
      marginBottom: 0,
    },
    resendText: {
      color: theme.colors.text.secondary,
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 24,
      textAlign: "center",
    },
    resendLink: {
      color: theme.colors.text.primary,
      textDecorationLine: "underline",
      fontWeight: "500" as const,
      fontSize: 16,
    },
    backButton: {
      marginTop: 14,
    },
    backButtonText: {
      color: theme.colors.text.secondary,
      fontSize: 14,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ThemeView style={dynamicStyles.content}>
        <View style={dynamicStyles.iconContainer}>
          <SvgIcon
            name="email"
            size={48}
            color={theme.colors.primary.main}
            stroke={theme.colors.white}
          />
        </View>
        <ThemeText style={dynamicStyles.title}>{t("auth.passwordreset.title")}</ThemeText>
        <ThemeText style={dynamicStyles.subtitle}>
          {t("auth.passwordreset.subtitle")}{" "}
          <ThemeText style={dynamicStyles.span}>{email}</ThemeText>
        </ThemeText>
        <View style={dynamicStyles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={dynamicStyles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </View>
        {error ? <ThemeText style={dynamicStyles.errorText}>{error}</ThemeText> : null}
        {/* Error message */}
        <Button
          title="Continue"
          onPress={onSubmit}
          style={dynamicStyles.button}
          loading={isLoading}
          disabled={isLoading}
        />
        <View style={dynamicStyles.resendContainer}>
          <View>
            <ThemeText style={dynamicStyles.resendText}>Don’t receive the email? </ThemeText>
          </View>
          <TouchableOpacity
            onPress={() => {
              handleResendOtp();
            }}
          >
            <ThemeText style={dynamicStyles.resendLink}>Click to resend</ThemeText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={dynamicStyles.backButton}
        >
          <ThemeText style={dynamicStyles.backButtonText}>Back to login</ThemeText>
        </TouchableOpacity>
      </ThemeView>
    </SafeAreaView>
  );
}
