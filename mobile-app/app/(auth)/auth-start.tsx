import React from "react";
import {
  StyleSheet,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  View,
  Dimensions,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/theme";
import { ThemeButton, ThemeText, ThemeView } from "@/components";
import { useTranslation } from "react-i18next";
import { Images } from "@/assets";

const { width } = Dimensions.get("window");

function AuthStart() {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    router.push("/(auth)/login");
  };

  const dynamicStyles: {
    container: ViewStyle;
    imageContainer: ViewStyle;
    profileImage: ImageStyle;
    contentContainer: ViewStyle;
    title: TextStyle;
    subtitle: TextStyle;
    buttonContainer: ViewStyle;
    getStartedButton: ViewStyle;
    getStartedButtonText: TextStyle;
  } = {
    container: {
      flex: 1,
      // backgroundColor: theme.colors.background.default,
      justifyContent: "center",
      alignItems: "center",
    },
    imageContainer: {
      width: 345,
      height: 345,
      overflow: "hidden",
      marginBottom: 48,
      backgroundColor: "transparent",
    },
    profileImage: {
      width: "100%",
      height: "100%",
    },
    contentContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: theme.colors.text.primary,
      marginBottom: 16,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "400" as const,
      color: theme.colors.text.secondary,
      marginBottom: 0,
      textAlign: "center",
      maxWidth: width * 0.8,
    },
    buttonContainer: {
      width: "100%",
      paddingHorizontal: 24,
      marginTop: 40,
    },
    getStartedButton: {
      backgroundColor: theme.colors.text.primary,
      borderRadius: 10,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    getStartedButtonText: {
      color: theme.colors.background.default,
      fontSize: 18,
      fontWeight: "500" as const,
      letterSpacing: 0.5,
    },
  };

  return (
    <ImageBackground
      source={Images.ts_splash_gradient} // 👈 replace with your background image
      style={{ flex: 1 }}
      resizeMode="cover"
      blurRadius={0}
      imageStyle={{ opacity: 0.02 }}
    >
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <ThemeView style={dynamicStyles.contentContainer}>
          {/* Profile Image Circle */}
          <View style={dynamicStyles.imageContainer}>
            <Image
              source={Images.terminal_vendyone}
              style={dynamicStyles.profileImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <ThemeText style={dynamicStyles.title}>{t("auth.authStart.title")}</ThemeText>

          {/* Subtitle */}
          <ThemeText style={dynamicStyles.subtitle}>{t("auth.authStart.subtitle")}</ThemeText>
        </ThemeView>

        {/* Get Started Button */}
        <View style={dynamicStyles.buttonContainer}>
          <ThemeButton
            title={t("auth.authStart.getStarted")}
            onPress={handleGetStarted}
            style={dynamicStyles.getStartedButton}
            textStyle={dynamicStyles.getStartedButtonText}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
});

export default AuthStart;
