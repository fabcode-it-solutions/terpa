import { persist } from "zustand/middleware";
import { sendExtensionAuthToken, sendExtensionLogout } from "@/utils/extension";
import {
  mmkvJSONStateStorage,
  clearEverything,
  setTokenInNative,
  deleteTokenFromNative,
  create,
} from "./stateStorage";
import { setAuthToken } from "@/services/api/token";
import { setOnUnauthorized } from "@/services/api/events";
import { router } from "expo-router";
import {
  loginWithBasic,
  getSession,
  requestPasswordRecovery,
  submitPasswordRecovery,
  exchangeTotpToken,
  TokenType,
  LoginResponse,
} from "@/services/api/auth";
import type { AuthUser } from "@/services/api/schemas";

type User = AuthUser & { name?: string };

type State = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  totpToken: string | null;
  totpEmail: string | null;
  isTotpRequired: boolean;
  resetEmail?: string | null;
  resetToken?: string | null;
};

type Actions = {
  login: (credentials: { email: string; password: string }) => Promise<{ requiresTotp: boolean }>;
  register: (credentials: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
  setToken: (token: string, user: User) => void;
  reset: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verifyResetCode: (args: { email: string; code: string }) => Promise<string>;
  resetPassword: (args: { token: string; password: string }) => Promise<void>;
  verifyTotp: (args: { code: string }) => Promise<void>;
  clearTotp: () => void;
};

const initialState: State = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  totpToken: null,
  totpEmail: null,
  isTotpRequired: false,
  resetEmail: null,
  resetToken: null,
};

// API base URL now handled by the shared api client + endpoints

// Private cleanup function for logout and delete account
const performCompleteCleanup = async () => {
  clearEverything();
  setAuthToken(null);
};

const determineTokenType = (response?: Partial<LoginResponse>): TokenType => {
  if (!response) {
    console.log("[AUTH_STORE] determineTokenType: No response, defaulting to 'full'");
    return "full";
  }

  const result = (response.type ??
    response.tokenType ??
    (response.requiresTotp ? "totp" : "full")) as TokenType;

  console.log("[AUTH_STORE] determineTokenType logic:", {
    "response.type": response.type,
    "response.tokenType": response.tokenType,
    "response.requiresTotp": response.requiresTotp,
    "final result": result,
  });

  return result;
};

const formatUser = (raw?: AuthUser | null): User | null => {
  if (!raw) return null;
  const name =
    raw.firstName || raw.lastName
      ? `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim()
      : undefined;

  return {
    ...raw,
    name,
  };
};

const hydrateUser = async (
  maybeUser: AuthUser | null | undefined,
  errorMessage: string,
): Promise<User | null> => {
  if (maybeUser) {
    return formatUser(maybeUser);
  }

  const session = await getSession().catch((e) => {
    throw new Error(e?.message || errorMessage);
  });

  if (session?.user) {
    return formatUser(session.user as AuthUser);
  }

  return null;
};

export const useAuthStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      login: async (credentials) => {
        console.log("[AUTH_STORE] Login attempt for:", credentials.email);
        set({
          isLoading: true,
          error: null,
          isTotpRequired: false,
          totpToken: null,
          totpEmail: null,
        });
        try {
          const loginRes = await loginWithBasic(credentials.email, credentials.password);
          console.log("[AUTH_STORE] Login response received:", {
            hasToken: !!loginRes?.token,
            type: loginRes?.type,
            tokenType: loginRes?.tokenType,
            requiresTotp: loginRes?.requiresTotp,
          });

          if (!loginRes?.token) {
            throw new Error("Login response missing token");
          }

          const tokenType = determineTokenType(loginRes);
          console.log("[AUTH_STORE] Determined token type:", tokenType);

          if (tokenType === "totp") {
            console.log("[AUTH_STORE] 2FA required - redirecting to TOTP screen");
            set({
              isLoading: false,
              error: null,
              totpToken: loginRes.token,
              totpEmail: credentials.email,
              isTotpRequired: true,
              token: null,
              user: null,
              isAuthenticated: false,
            });
            setAuthToken(null);
            deleteTokenFromNative();
            sendExtensionLogout();
            return { requiresTotp: true };
          }

          console.log("[AUTH_STORE] No 2FA required - proceeding with full authentication");

          // Set token BEFORE calling hydrateUser, which may call getSession()
          setTokenInNative(loginRes.token);
          setAuthToken(loginRes.token);
          sendExtensionAuthToken(loginRes.token);

          const user = await hydrateUser(
            loginRes.user as AuthUser | null | undefined,
            "Failed to fetch session after login",
          );

          set({
            token: loginRes.token,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isTotpRequired: false,
            totpToken: null,
            totpEmail: null,
          });

          return { requiresTotp: false };
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
          throw error;
        }
      },

      verifyTotp: async ({ code }) => {
        const trimmedCode = code.trim();
        const { totpToken } = get();

        if (!totpToken) {
          const message = "Two-factor authentication is not pending";
          set({ error: message, isTotpRequired: false });
          throw new Error(message);
        }

        if (!trimmedCode) {
          const message = "Authentication code is required";
          set({ error: message });
          throw new Error(message);
        }

        if (!/^[0-9]{6}$/.test(trimmedCode)) {
          const message = "Authentication code must be 6 digits";
          set({ error: message });
          throw new Error(message);
        }

        set({ isLoading: true, error: null });

        try {
          const exchangeRes = await exchangeTotpToken({
            token: totpToken,
            otp: trimmedCode,
          });

          if (!exchangeRes?.token) {
            throw new Error("TOTP exchange response missing token");
          }

          const tokenType = determineTokenType(exchangeRes);
          if (tokenType !== "full") {
            throw new Error("TOTP verification did not return a full token");
          }

          // Set token BEFORE calling hydrateUser, which may call getSession()
          setTokenInNative(exchangeRes.token);
          setAuthToken(exchangeRes.token);
          sendExtensionAuthToken(exchangeRes.token);

          let user: User | null = null;
          try {
            user = await hydrateUser(
              exchangeRes.user as AuthUser | null | undefined,
              "Failed to fetch session after TOTP verification",
            );
          } catch (hydrateError) {
            setAuthToken(null);
            deleteTokenFromNative();
            throw hydrateError;
          }

          set({
            token: exchangeRes.token,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isTotpRequired: false,
            totpToken: null,
            totpEmail: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "TOTP verification failed. Please try again.",
          });
          throw error;
        }
      },

      register: async (_credentials) => {
        // Registration endpoint is not implemented in this client yet.
        // Surface a clear error for the UI to handle gracefully.
        set({ isLoading: false, error: "Registration is not supported yet." });
        throw new Error("Registration is not supported yet.");
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await requestPasswordRecovery(email);
          set({ isLoading: false, resetEmail: email });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Request failed",
          });
          throw error;
        }
      },

      verifyResetCode: async ({ email, code }) => {
        // Postman flow expects using a token from email; treat entered code as token for demo
        set({ resetEmail: email, resetToken: code });
        return code;
      },

      resetPassword: async ({ token, password }) => {
        set({ isLoading: true, error: null });
        try {
          await submitPasswordRecovery({ token, password, confirmPassword: password });
          set({ isLoading: false, resetToken: null });
        } catch (error) {
          set({ isLoading: false, error: error instanceof Error ? error.message : "Reset failed" });
          throw error;
        }
      },

      logout: async () => {
        // No bearer logout endpoint in v1 reference; perform local cleanup
        try {
          sendExtensionLogout();
        } finally {
          await performCompleteCleanup();
        }
      },

      deleteAccount: async () => {
        const { token } = get();

        if (!token) {
          throw new Error("No auth token available");
        }

        try {
          const response = await fetch(`${"API_URL"}/users/current`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Account deletion failed");
          }

          // After successful deletion, perform complete cleanup
          sendExtensionLogout();
          await performCompleteCleanup();
        } catch (error) {
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      clearTotp: () =>
        set({
          totpToken: null,
          totpEmail: null,
          isTotpRequired: false,
        }),

      setToken: (token, user) => {
        setTokenInNative(token);
        setAuthToken(token);
        sendExtensionAuthToken(token);
        set({
          token,
          user,
          isAuthenticated: true,
          isTotpRequired: false,
          totpToken: null,
          totpEmail: null,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: "auth-store",
      storage: mmkvJSONStateStorage,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          const token = state?.token ?? null;
          setAuthToken(token);
          if (token) {
            // Ensure native side also has the token on cold start
            setTokenInNative(token);
          }
        } catch {}
      },
    },
  ),
);

// Register a global unauthorized handler used by the API client
setOnUnauthorized(async () => {
  try {
    await useAuthStore.getState().logout();
  } finally {
    router.replace("/(auth)/login");
  }
});
