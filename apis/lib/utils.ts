import { clsx, type ClassValue } from "clsx";
import { add, isBefore } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

export enum MachineOnlineStatus {
  noData = "noData",
  online = "online",
  warning = "warning",
  offline = "offline",
}

export function getMachineOnlineStatus(
  date?: Date | null,
): MachineOnlineStatus {
  // No data
  if (!date) {
    return MachineOnlineStatus.noData;
  }
  // More than 30 minutes offline
  if (isBefore(date, add(new Date(), { minutes: -30 }))) {
    return MachineOnlineStatus.offline;
  }
  // More than 10 minutes offline
  if (isBefore(date, add(new Date(), { minutes: -10 }))) {
    return MachineOnlineStatus.warning;
  }
  // Online
  return MachineOnlineStatus.online;
}
