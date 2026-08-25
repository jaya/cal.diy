import { TimeFormat } from "@calcom/lib/timeFormat";
import { describe, expect, it } from "vitest";
import { formatBusinessHour, getOutsideBusinessHoursReason } from "./businessHours";

// 2026-08-25 is a Tuesday, 2026-08-28 a Friday, 2026-08-29 a Saturday and 2026-08-30 a Sunday.
const check = ({
  startTime,
  durationInMinutes = 30,
  timeZone = "UTC",
  businessHours,
}: {
  startTime: string;
  durationInMinutes?: number | null;
  timeZone?: string;
  businessHours?: { startHour: number; endHour: number; days: number[] };
}) => getOutsideBusinessHoursReason({ startTime, durationInMinutes, timeZone, businessHours });

describe("getOutsideBusinessHoursReason", () => {
  it("returns null for a booking that fits inside business hours", () => {
    expect(check({ startTime: "2026-08-25T13:00:00.000Z" })).toBe(null);
  });

  it("returns null for a booking starting exactly when the business day opens", () => {
    expect(check({ startTime: "2026-08-25T09:00:00.000Z" })).toBe(null);
  });

  it("returns null for a booking ending exactly when the business day closes", () => {
    expect(check({ startTime: "2026-08-25T17:30:00.000Z", durationInMinutes: 30 })).toBe(null);
  });

  it("flags a booking that starts before the business day opens", () => {
    expect(check({ startTime: "2026-08-25T08:30:00.000Z" })).toBe("before_opening");
  });

  it("flags a booking that starts exactly when the business day closes", () => {
    expect(check({ startTime: "2026-08-25T18:00:00.000Z" })).toBe("after_closing");
  });

  it("flags a booking that starts after the business day closes", () => {
    expect(check({ startTime: "2026-08-25T21:00:00.000Z" })).toBe("after_closing");
  });

  it("flags a booking that starts within business hours but runs past closing time", () => {
    expect(check({ startTime: "2026-08-25T17:30:00.000Z", durationInMinutes: 60 })).toBe(
      "ends_after_closing"
    );
  });

  it("flags bookings on days the business is closed", () => {
    expect(check({ startTime: "2026-08-29T13:00:00.000Z" })).toBe("non_business_day");
    expect(check({ startTime: "2026-08-30T13:00:00.000Z" })).toBe("non_business_day");
  });

  describe("booker timezone", () => {
    it("evaluates the same instant against the booker's own wall clock", () => {
      const startTime = "2026-08-25T13:00:00.000Z";

      expect(check({ startTime, timeZone: "UTC" })).toBe(null);
      // 10:00 in São Paulo.
      expect(check({ startTime, timeZone: "America/Sao_Paulo" })).toBe(null);
      // 22:00 in Tokyo.
      expect(check({ startTime, timeZone: "Asia/Tokyo" })).toBe("after_closing");
    });

    it("uses the day the booking falls on in the booker's timezone", () => {
      // Friday 22:00 UTC is already Saturday 07:00 in Tokyo.
      expect(check({ startTime: "2026-08-28T22:00:00.000Z", timeZone: "Asia/Tokyo" })).toBe(
        "non_business_day"
      );
      // Tuesday 23:00 UTC is Wednesday 08:00 in Tokyo, before the business day opens.
      expect(check({ startTime: "2026-08-25T23:00:00.000Z", timeZone: "Asia/Tokyo" })).toBe("before_opening");
    });

    it("compares against local opening time on a day the timezone offset shifts", () => {
      // New York moves to EDT on 2026-03-08, so 13:00 UTC on the Monday after is 09:00 locally.
      expect(check({ startTime: "2026-03-09T13:00:00.000Z", timeZone: "America/New_York" })).toBe(null);
      expect(check({ startTime: "2026-03-09T12:30:00.000Z", timeZone: "America/New_York" })).toBe(
        "before_opening"
      );
    });
  });

  it("honours custom business hours", () => {
    const businessHours = { startHour: 7, endHour: 22, days: [0, 1, 2, 3, 4, 5, 6] };

    expect(check({ startTime: "2026-08-30T13:00:00.000Z", businessHours })).toBe(null);
    expect(check({ startTime: "2026-08-25T21:45:00.000Z", durationInMinutes: 30, businessHours })).toBe(
      "ends_after_closing"
    );
    expect(check({ startTime: "2026-08-25T06:30:00.000Z", businessHours })).toBe("before_opening");
  });

  it("treats a missing duration as a zero length booking", () => {
    expect(check({ startTime: "2026-08-25T17:59:00.000Z", durationInMinutes: null })).toBe(null);
  });

  it("returns null when the start time can't be parsed", () => {
    expect(check({ startTime: "not-a-date" })).toBe(null);
  });
});

describe("formatBusinessHour", () => {
  it("formats the hour using the booker's time format", () => {
    expect(formatBusinessHour(9, TimeFormat.TWENTY_FOUR_HOUR)).toBe("09:00");
    expect(formatBusinessHour(18, TimeFormat.TWENTY_FOUR_HOUR)).toBe("18:00");
    expect(formatBusinessHour(9, TimeFormat.TWELVE_HOUR)).toBe("9:00am");
    expect(formatBusinessHour(18, TimeFormat.TWELVE_HOUR)).toBe("6:00pm");
  });
});
