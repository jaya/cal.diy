import dayjs from "@calcom/dayjs";
import type { TimeFormat } from "@calcom/lib/timeFormat";

export type BusinessHours = {
  /** Hour the business day opens, in 24h format. */
  startHour: number;
  /**
   * Hour the business day closes, in 24h format. A booking that ends exactly at this hour is
   * still within business hours.
   */
  endHour: number;
  /** Days the business is open, following `dayjs().day()`, so 0 is Sunday. */
  days: number[];
};

export const BUSINESS_HOURS: BusinessHours = {
  startHour: 9,
  endHour: 18,
  days: [1, 2, 3, 4, 5],
};

export type OutsideBusinessHoursReason =
  /** The booking falls on a day the business is closed, a weekend by default. */
  | "non_business_day"
  /** The booking starts before the business day opens. */
  | "before_opening"
  /** The booking starts after the business day has closed. */
  | "after_closing"
  /** The booking starts within business hours but runs past closing time. */
  | "ends_after_closing";

/**
 * Tells whether a booking falls outside business hours *in the booker's own timezone*, which is the
 * timezone the slot is presented in. Slots are always within the host's availability, so what this
 * catches is a time that is unusual for whoever is doing the booking - most often the result of a
 * large timezone gap between them and the host.
 *
 * Everything is compared as minutes on the booker's wall clock. Building `dayjs` boundaries out of
 * the slot instead would be tempting, but setters on a `.tz()` instance resolve against the machine
 * timezone rather than the target one, which silently breaks the comparison for anyone whose
 * computer isn't in `timeZone`.
 *
 * @returns why the booking is outside business hours, or `null` when it is within them.
 */
export const getOutsideBusinessHoursReason = ({
  startTime,
  durationInMinutes,
  timeZone,
  businessHours = BUSINESS_HOURS,
}: {
  /** Start of the booking, in ISO format. */
  startTime: string;
  durationInMinutes: number | null;
  timeZone: string;
  businessHours?: BusinessHours;
}): OutsideBusinessHoursReason | null => {
  const startInUtc = dayjs.utc(startTime);
  // A slot we can't parse isn't something to warn the booker about.
  if (!startInUtc.isValid()) return null;

  const start = startInUtc.tz(timeZone);
  if (!businessHours.days.includes(start.day())) return "non_business_day";

  const opensAt = businessHours.startHour * 60;
  const closesAt = businessHours.endHour * 60;
  const startsAt = start.hour() * 60 + start.minute();

  if (startsAt < opensAt) return "before_opening";
  if (startsAt >= closesAt) return "after_closing";

  const endsAt = startsAt + Math.max(durationInMinutes ?? 0, 0);
  if (endsAt > closesAt) return "ends_after_closing";

  return null;
};

/** Formats one of the business hour boundaries using the booker's 12h/24h preference. */
export const formatBusinessHour = (hour: number, timeFormat: TimeFormat) =>
  dayjs.utc().startOf("day").add(hour, "hour").format(timeFormat);
