import {
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

// Monterrey timezone
const MONTERREY_TIMEZONE = "America/Monterrey";

/**
 * Formats a date to YYYY-MM-DD format
 */
export function formatDateToYYYYMMDD(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Parses a YYYY-MM-DD string to a Date object in America/Monterrey timezone
 */
export function parseDateInMonterreyTimezone(
  dateString: string,
  isEndOfDay = false,
): Date {
  // Parse the date string to a Date object in Monterrey timezone
  const parsedDate = parseISO(`${dateString}T00:00:00.000`);
  const zonedDate = fromZonedTime(parsedDate, MONTERREY_TIMEZONE);

  // If it's end of day, set to 23:59:59.999
  if (isEndOfDay) {
    return endOfDay(zonedDate);
  }

  return startOfDay(zonedDate);
}

/**
 * Converts a Date to America/Monterrey timezone
 */
export function convertToMonterreyTimezone(date: Date): Date {
  return toZonedTime(date, MONTERREY_TIMEZONE);
}

/**
 * Formats a date in Monterrey timezone
 */
export function formatInMonterreyTimezone(
  date: Date,
  formatString: string,
): string {
  const monterreyDate = toZonedTime(date, MONTERREY_TIMEZONE);
  return format(monterreyDate, formatString);
}

/**
 * Validates if a string is in YYYY-MM-DD format
 */
export function isValidYYYYMMDDFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

export function getStartOfMonthInMonterrey(year: number, month: number): Date {
  const date = new Date(year, month - 1, 1);
  const zonedDate = fromZonedTime(date, MONTERREY_TIMEZONE);
  return startOfMonth(zonedDate);
}

export function getEndOfMonthInMonterrey(year: number, month: number): Date {
  const date = new Date(year, month - 1, 1);
  const zonedDate = fromZonedTime(date, MONTERREY_TIMEZONE);
  return endOfMonth(zonedDate);
}

export function formatDate(date: Date, formatString: string): string {
  return formatInTimeZone(date, "UTC", formatString);
}
