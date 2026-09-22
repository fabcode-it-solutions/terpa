import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";

export type TokenType = "full" | "totp";

export type LoginResponse = {
  token: string;
  type?: TokenType;
  tokenType?: TokenType;
  requiresTotp?: boolean;
  // Some servers might include session payloads on login; keep flexible
  authenticated?: boolean;
  user?: any;
};

export type SessionResponse = {
  authenticated: boolean;
  requiresTotp?: boolean;
  session?: { uid: string; role: string; type: string };
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
  };
};

function safeBtoa(input: string): string {
  if (typeof globalThis.btoa === "function") return btoa(input);
  // Minimal Base64 encoder for ASCII strings (email/password are ASCII)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input;
  let output = "";
  for (
    let block = 0, charCode: number, i = 0, map = chars;
    str.charAt(i | 0) || ((map = "="), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) throw new Error("Invalid character in btoa polyfill");
    block = (block << 8) | charCode;
  }
  return output;
}

export async function loginWithBasic(email: string, password: string): Promise<LoginResponse> {
  const basic = `Basic ${safeBtoa(`${email}:${password}`)}`;
  return apiClient.post<LoginResponse>(endpoints.auth.login, undefined, {
    headers: {
      Authorization: basic,
      Accept: "application/json",
    },
  });
}

export async function exchangeTotpToken(args: {
  token: string;
  otp: string;
}): Promise<LoginResponse> {
  const { token, otp } = args;
  return apiClient.post<LoginResponse>(
    endpoints.auth.exchangeTotp,
    { otp },
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function getSession(): Promise<SessionResponse> {
  return apiClient.get<SessionResponse>(endpoints.auth.session, {
    headers: { Accept: "application/json" },
  });
}

export async function requestPasswordRecovery(
  email: string,
): Promise<{ success: boolean; message?: string }> {
  return apiClient.post(
    endpoints.auth.requestRecovery,
    { email },
    {
      headers: { Accept: "application/json" },
    },
  );
}

export async function submitPasswordRecovery(args: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{ success: boolean; requiresTotp?: boolean; message?: string }> {
  return apiClient.post(endpoints.auth.submitRecovery, args, {
    headers: { Accept: "application/json" },
  });
}
