import type { Dayjs } from "@calcom/dayjs";

export const BUSINESS_HOURS_START = 9;
export const BUSINESS_HOURS_END = 18;

export function isOutsideOfBusinessHours(date: Dayjs): boolean {
  const day = date.day();
  const hour = date.hour();
  const isWeekend = day === 0 || day === 6;
  const isOutsideHours = hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END;
  return isWeekend || isOutsideHours;
}
