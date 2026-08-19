import dayjs from "@calcom/dayjs";
import { isOutsideBusinessHours } from "./isOutsideBusinessHours";

describe("isOutsideBusinessHours", () => {
  it.each([
    ["2026-08-18T08:59:00", 30],
    ["2026-08-18T16:30:00", 60],
    ["2026-08-18T17:00:00", 0],
  ])("flags a booking at %s lasting %i minutes", (start, duration) => {
    expect(isOutsideBusinessHours(dayjs(start), duration)).toBe(true);
  });

  it.each([
    ["2026-08-18T09:00:00", 30],
    ["2026-08-18T12:00:00", 60],
    ["2026-08-18T16:30:00", 30],
  ])("does not flag a booking at %s lasting %i minutes", (start, duration) => {
    expect(isOutsideBusinessHours(dayjs(start), duration)).toBe(false);
  });
});
