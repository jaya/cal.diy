import common from "@calcom/i18n/locales/en/common.json";
import { TimeFormat } from "@calcom/lib/timeFormat";
import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";
import { OutsideBusinessHoursWarning } from "./OutsideBusinessHoursWarning";

// i18next is never initialised under vitest, so `t` gives back the key it was handed. That makes
// the assertions below a check of *which* message the component picked; the copy itself is covered
// by the interpolation test at the bottom of this file.
const renderWarning = ({
  startTime,
  durationInMinutes = 30,
  timeZone = "UTC",
}: {
  startTime: string;
  durationInMinutes?: number | null;
  timeZone?: string;
}) =>
  render(
    <OutsideBusinessHoursWarning
      startTime={startTime}
      durationInMinutes={durationInMinutes}
      timeZone={timeZone}
      timeFormat={TimeFormat.TWENTY_FOUR_HOUR}
    />
  );

describe("OutsideBusinessHoursWarning", () => {
  it("renders nothing for a booking within business hours", () => {
    // Tuesday 13:00.
    renderWarning({ startTime: "2026-08-25T13:00:00.000Z" });

    expect(screen.queryByTestId("outside-business-hours-warning")).not.toBeInTheDocument();
  });

  it("warns when the booking starts after the business day has closed", () => {
    renderWarning({ startTime: "2026-08-25T21:00:00.000Z" });

    expect(screen.getByTestId("outside-business-hours-warning")).toBeInTheDocument();
    expect(screen.getByText("outside_business_hours_title")).toBeInTheDocument();
    expect(screen.getByText("outside_business_hours_time_description")).toBeInTheDocument();
  });

  it("warns when the booking falls on a day the business is closed", () => {
    // Saturday.
    renderWarning({ startTime: "2026-08-29T13:00:00.000Z" });

    expect(screen.getByText("outside_business_hours_day_description")).toBeInTheDocument();
  });

  it("warns when the booking runs past closing time", () => {
    renderWarning({ startTime: "2026-08-25T17:30:00.000Z", durationInMinutes: 60 });

    expect(screen.getByText("outside_business_hours_end_description")).toBeInTheDocument();
  });

  it("evaluates the slot against the booker's timezone", () => {
    // 13:00 UTC is 22:00 in Tokyo.
    renderWarning({ startTime: "2026-08-25T13:00:00.000Z", timeZone: "Asia/Tokyo" });

    expect(screen.getByTestId("outside-business-hours-warning")).toBeInTheDocument();
  });
});

describe("message copy", () => {
  it("interpolates without mangling the values", async () => {
    // i18next escapes interpolated values by default, which turns anything containing a slash - a
    // timezone name, say - into `America&#x2F;Sao_Paulo` on the page. Guard the real strings.
    const i18n = createInstance();
    await i18n.init({ lng: "en", resources: { en: { common } } });
    const t = i18n.getFixedT("en", "common");

    const messages = [
      t("outside_business_hours_title"),
      t("outside_business_hours_day_description"),
      t("outside_business_hours_time_description", { opensAt: "9:00am", closesAt: "6:00pm" }),
      t("outside_business_hours_end_description", { closesAt: "6:00pm" }),
    ];

    for (const message of messages) {
      expect(message).not.toMatch(/&(#x?[0-9a-f]+|amp|quot|lt|gt);/i);
      // A leftover placeholder means the component isn't passing every value the string needs.
      expect(message).not.toContain("{{");
    }
  });
});
