// Load env vars depending on the active environment/profile
// Supports: .env, .env.local, .env.<profile>, .env.<profile>.local
// where <profile> comes from EAS_BUILD_PROFILE, APP_ENV, or NODE_ENV
import { ExpoConfig } from "@expo/config-types";
import * as dotenv from "dotenv";
import { existsSync } from "node:fs";

const profile =
  process.env.EAS_BUILD_PROFILE ||
  process.env.APP_ENV ||
  (process.env.NODE_ENV === "production" ? "production" : "development");

const candidates = [".env", ".env.local", `.env.${profile}`, `.env.${profile}.local`];

for (const p of candidates) {
  if (existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

const config: ExpoConfig = {
  assetBundlePatterns: ["**/*"],
  name: "TerpaMobile",
  slug: "terpa-solutions-uzklfr7nq1bgwxxb7acan",
  version: "1.0.1",
  icon: "./assets/images/ios-dark.png",
  orientation: "default",
  scheme: "terpasolutions",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.terpasolutions.appclient",
    icon: {
      dark: "./assets/images/ios-dark.png",
      light: "./assets/images/ios-light.png",
      tinted: "./assets/images/ios-tinted.png",
    },
    associatedDomains: ["applinks:terpasolutions.com"],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
    package: "com.terpasolutions.appclient",
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#fafafa",
        image: "./assets/images/splash-icon.png",
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: "#1D222E",
        },
      },
    ],
    ["expo-build-properties"],
    "expo-font",
    "expo-web-browser",
    "expo-localization",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    defaultTeamId: process.env.EXPO_PUBLIC_DEFAULT_TEAM_ID,
    demoAuth: process.env.EXPO_PUBLIC_DEMO_AUTH,
    router: {
      origin: false,
    },
    eas: {
      projectId: "91d79d0a-31d9-4307-8d8f-9e1a461dc393",
    },
  },
  owner: "terpasolutions",
};

export default config;
