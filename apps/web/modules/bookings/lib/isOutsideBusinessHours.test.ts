import dayjs from "@calcom/dayjs";
import { isOutsideBusinessHours } from "./isOutsideBusinessHours";

describe("isOutsideBusinessHours", () => {
  it.each([
    ["2026-08-18T08:59:00", 30],
    ["2026-08-18T16:30:00", 60],
    ["2026-08-18T17:00:00", 0],
    ["2026-08-18T21:00:00", 30],
  ])("flags a weekday booking at %s lasting %i minutes", (start, duration) => {
    expect(isOutsideBusinessHours(dayjs(start), duration)).toBe(true);
  });

  it.each([
    ["2026-08-18T09:00:00", 30],
    ["2026-08-18T12:00:00", 60],
    ["2026-08-18T16:30:00", 30],
  ])("does not flag a weekday booking at %s lasting %i minutes", (start, duration) => {
    expect(isOutsideBusinessHours(dayjs(start), duration)).toBe(false);
  });

  it("flags Saturday even during daytime hours", () => {
    expect(isOutsideBusinessHours(dayjs("2026-08-22T10:00:00"), 30)).toBe(true);
  });

  it("flags Sunday even during daytime hours", () => {
    expect(isOutsideBusinessHours(dayjs("2026-08-23T10:00:00"), 30)).toBe(true);
  });

  it("uses the booker's timezone rather than UTC", () => {
    const saoPauloMorning = dayjs.utc("2026-08-18T12:00:00.000Z").tz("America/Sao_Paulo");
    const newYorkMorning = dayjs.utc("2026-08-18T12:00:00.000Z").tz("America/New_York");

    expect(saoPauloMorning.format("HH:mm")).toBe("09:00");
    expect(newYorkMorning.format("HH:mm")).toBe("08:00");
    expect(isOutsideBusinessHours(saoPauloMorning, 30)).toBe(false);
    expect(isOutsideBusinessHours(newYorkMorning, 30)).toBe(true);
  });
});
