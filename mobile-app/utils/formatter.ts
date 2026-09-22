import { formatRelativeTime as formatRelativeTimeDfns } from "./date";
/**
 * Formats the reading time in minutes
 * @param minutes Time in minutes
 */
export const formatReadTime = (minutes: number): string => {
  if (!minutes) return "0 min";

  if (minutes < 1) {
    return "< 1 min";
  }

  return `${Math.round(minutes)} min`;
};

/**
 * Formats the publish date in relative time (e.g., "2 days ago")
 * @param dateString The ISO date string or Date object
 */
// Prefer the i18n-aware implementation from utils/date to avoid duplication
export const formatRelativeTime = (dateString: string | Date): string => {
  const iso = typeof dateString === "string" ? dateString : dateString?.toISOString?.();
  return formatRelativeTimeDfns(iso);
};

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const truncateWords = (text: string, limit: number) => {
  const words = text.split(" ");
  return words.length > limit ? `${words.slice(0, limit).join(" ")}...` : text;
};

/**
 * Formats a date string into a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMS = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMS / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Today
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `Today at ${formattedHours}:${formattedMinutes} ${ampm}`;
  } else if (diffInDays === 1) {
    // Yesterday
    return "Yesterday";
  } else if (diffInDays < 7) {
    // Within a week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
  } else if (diffInDays < 365) {
    // Within a year
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } else {
    // More than a year ago
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
};

/**
 * Formats a number with thousand separators
 * @param value Number to format
 * @returns Formatted number string (e.g., 2981 becomes "2,981")
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US");
};

/**
 * Pluralizes a word based on count
 * @param count The count to check
 * @param singular Singular form of the word
 * @param plural Plural form of the word
 * @returns The correct form based on count
 */
export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};
