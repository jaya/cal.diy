import type { Dayjs } from "@calcom/dayjs";

export const BUSINESS_HOURS_START = 9;
export const BUSINESS_HOURS_END = 17;

/**
 * Checks the complete booking interval against the booker's local business hours.
 * The caller is responsible for converting `start` to the booker's timezone.
 */
export const isOutsideBusinessHours = (start: Dayjs, durationMinutes = 0): boolean => {
  const startOfBusinessDay = start.startOf("day").hour(BUSINESS_HOURS_START);
  const endOfBusinessDay = start.startOf("day").hour(BUSINESS_HOURS_END);
  const end = start.add(durationMinutes, "minute");

  return (
    start.isBefore(startOfBusinessDay) || !start.isBefore(endOfBusinessDay) || end.isAfter(endOfBusinessDay)
  );
};
