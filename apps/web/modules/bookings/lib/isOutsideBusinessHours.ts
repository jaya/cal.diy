import type { Dayjs } from "@calcom/dayjs";

const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 17;

const isWeekend = (date: Dayjs): boolean => {
  const day = date.day();
  return day === 0 || day === 6;
};

/**
 * Typical business hours in the booker's local timezone: Monday–Friday, 09:00–17:00.
 * The caller must convert `start` to that timezone before calling.
 */
export const isOutsideBusinessHours = (start: Dayjs, durationMinutes: number = 0): boolean => {
  if (isWeekend(start)) {
    return true;
  }

  const startOfBusinessDay = start.startOf("day").hour(BUSINESS_HOURS_START);
  const endOfBusinessDay = start.startOf("day").hour(BUSINESS_HOURS_END);
  const end = start.add(durationMinutes, "minute");

  return (
    start.isBefore(startOfBusinessDay) || !start.isBefore(endOfBusinessDay) || end.isAfter(endOfBusinessDay)
  );
};
