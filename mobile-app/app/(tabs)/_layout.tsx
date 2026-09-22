import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useTheme } from "@/theme";
// import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, SmartphoneNfc, Package, Users, Receipt } from "lucide-react-native";

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  const bg = theme.colors.tab.background;
  const activeColor = theme.colors.tab.text.primary; // Black text for labels
  const inactiveColor = theme.colors.tab.text.secondary;
  const activeIconColor = theme.colors.info.main; // Blue for icons only

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        // tabBarBackground:TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
            backgroundColor: bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: {
            paddingVertical: 10,
            backgroundColor: bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            elevation: 8,
          },
          default: {
            paddingVertical: 20,
            backgroundColor: bg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navigation.tabs.dashboard"),
          tabBarIcon: ({ focused }) => (
            <LayoutDashboard color={focused ? activeIconColor : inactiveColor} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="machine-list-screen"
        options={{
          title: t("navigation.tabs.machine"),
          tabBarIcon: ({ focused }) => (
            <SmartphoneNfc color={focused ? activeIconColor : inactiveColor} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t("navigation.tabs.products"),
          tabBarIcon: ({ focused }) => (
            <Package color={focused ? activeIconColor : inactiveColor} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: t("navigation.tabs.users"),
          tabBarIcon: ({ focused }) => (
            <Users color={focused ? activeIconColor : inactiveColor} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: t("navigation.tabs.billing"),
          tabBarIcon: ({ focused }) => (
            <Receipt color={focused ? activeIconColor : inactiveColor} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}
