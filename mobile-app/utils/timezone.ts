import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfMonth, endOfMonth, add } from "date-fns";

/**
 * The timezone used throughout the app for date calculations
 * This matches the web app's timezone setting
 */
export const TIMEZONE = "America/Monterrey";

/**
 * Converts a UTC date to the app's timezone (America/Monterrey)
 */
export const toAppTimezone = (date: Date): Date => {
  return toZonedTime(date, TIMEZONE);
};

/**
 * Converts a date from the app's timezone (America/Monterrey) to UTC
 */
export const fromAppTimezone = (date: Date): Date => {
  return fromZonedTime(date, TIMEZONE);
};

/**
 * Gets the start of the current month in the app's timezone
 * Returns a Date object in UTC that represents midnight on the first day of the current month in Monterrey
 */
export const getMonthStart = (): Date => {
  const now = new Date();
  const nowInTimezone = toAppTimezone(now);
  const monthStart = startOfMonth(nowInTimezone);
  return fromAppTimezone(monthStart);
};

/**
 * Gets the end of the current month in the app's timezone
 * Returns a Date object in UTC that represents 23:59:59.999 on the last day of the current month in Monterrey
 */
export const getMonthEnd = (): Date => {
  const now = new Date();
  const nowInTimezone = toAppTimezone(now);
  const monthEnd = endOfMonth(nowInTimezone);
  return fromAppTimezone(monthEnd);
};

/**
 * Gets the start of the next month in the app's timezone
 * Returns a Date object in UTC that represents midnight on the first day of the next month in Monterrey
 */
export const getNextMonthStart = (): Date => {
  const now = new Date();
  const nowInTimezone = toAppTimezone(now);
  const monthStart = startOfMonth(nowInTimezone);
  const nextMonthStart = add(monthStart, { months: 1 });
  return fromAppTimezone(nextMonthStart);
};
