import Constants from "expo-constants";

const extraApiBase: string | undefined =
  // Newer Expo
  // @ts-ignore
  (Constants?.expoConfig as any)?.extra?.apiBaseUrl ??
  // Older Expo manifest2
  // @ts-ignore
  (Constants as any)?.manifest2?.extra?.apiBaseUrl;

// Base URL should point to the site root. All endpoints in this app use
// absolute paths like "/api/v1/..." per the API reference and Postman collection.
// Avoid including a version segment in the base (e.g. "/v4"), otherwise URLs
// will become invalid like ".../v4/api/v1/...".
// Priority: EXPO_PUBLIC_API_BASE_URL (from .env / CI) -> expo.extra.apiBaseUrl -> default prod URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extraApiBase ?? "https://app.terpasolutions.com";

export const REQUEST_TIMEOUT_MS = 15000;
export const DEFAULT_RETRY_COUNT = 2; // For idempotent GETs

// Demo auth flag (can be toggled via app.json.extra.demoAuth or EXPO_PUBLIC_DEMO_AUTH)
const extraDemoAuth: unknown =
  // Newer Expo
  // @ts-ignore
  (Constants?.expoConfig as any)?.extra?.demoAuth ??
  // Older Expo manifest2
  // @ts-ignore
  (Constants as any)?.manifest2?.extra?.demoAuth;

const envDemo = process.env.EXPO_PUBLIC_DEMO_AUTH;
const coerceBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
};

// Default to false unless explicitly enabled via env or app config
export const DEMO_AUTH = coerceBool(envDemo ?? extraDemoAuth ?? false);

// Default team id (for endpoints that require team context)
const extraDefaultTeam: unknown =
  // @ts-ignore
  (Constants?.expoConfig as any)?.extra?.defaultTeamId ??
  // @ts-ignore
  (Constants as any)?.manifest2?.extra?.defaultTeamId;

export const DEFAULT_TEAM_ID: string | undefined =
  (process.env.EXPO_PUBLIC_DEFAULT_TEAM_ID as string | undefined) ??
  (typeof extraDefaultTeam === "string" ? extraDefaultTeam : undefined);
