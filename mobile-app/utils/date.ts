import { format, formatDistanceToNow } from "date-fns";
// Explicit locales to keep bundle small
import { es, enUS } from "date-fns/locale";

type DFNSLocale = typeof es | typeof enUS;

let currentLocale: DFNSLocale = es;

const mapLangToLocale = (lang?: string): DFNSLocale => {
  const code = String(lang || "es").toLowerCase();
  if (code.startsWith("es")) return es;
  // Default to English if not Spanish
  return enUS;
};

export const setDateLocale = (lang?: string) => {
  currentLocale = mapLangToLocale(lang);
};

export const formatRelativeTime = (iso?: string, lang?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    const loc = mapLangToLocale(lang) || currentLocale;
    return formatDistanceToNow(d, { addSuffix: true, locale: loc });
  } catch {
    return "";
  }
};

/**
 * Formats a date into a long, locale-aware string like "Saturday, 5 September 2025".
 * Mirrors Intl.DateTimeFormat options: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
 */
export const formatDateLong = (dateInput?: Date | string, lang?: string): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  try {
    const loc = mapLangToLocale(lang) || currentLocale;
    // Example: sábado, 5 septiembre 2025 (respects locale)
    return format(d, "EEEE, d LLLL yyyy", { locale: loc });
  } catch {
    return "";
  }
};

/**
 * Formats a date into a short format with abbreviated day and month, like "Sat, 5 Sep 2025".
 * Compact format suitable for buttons and narrow spaces.
 */
export const formatDateShort = (dateInput?: Date | string, lang?: string): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  try {
    const loc = mapLangToLocale(lang) || currentLocale;
    // Example: sáb, 5 sep 2025 (respects locale)
    return format(d, "EEE, d MMM yyyy", { locale: loc });
  } catch {
    return "";
  }
};

export const monthOptionsForLocale = (lang?: string): Array<{ label: string; value: string }> => {
  const loc = mapLangToLocale(lang) || currentLocale;
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return Array.from({ length: 12 }, (_, i) => {
    const idx = i + 1;
    const label = cap(format(new Date(2025, i, 1), "LLLL", { locale: loc }));
    return { label, value: String(idx) };
  });
};
