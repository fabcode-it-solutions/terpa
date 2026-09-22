import { Stack } from "expo-router";
import { useTheme } from "@/theme";

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: theme.colors.background.paper,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="auth-start"
        options={{
          title: "Auth Start",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Create Account",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="totp"
        options={{
          title: "Two-Factor",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forget-password"
        options={{
          title: "Forget Password",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="password-reset"
        options={{
          title: "Password Reset",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="new-password"
        options={{
          title: "Password Reset",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
