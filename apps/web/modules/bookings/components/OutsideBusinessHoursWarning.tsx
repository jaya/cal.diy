import {
  BUSINESS_HOURS,
  formatBusinessHour,
  getOutsideBusinessHoursReason,
} from "@calcom/features/bookings/Booker/utils/businessHours";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { TimeFormat } from "@calcom/lib/timeFormat";
import { Alert } from "@calcom/ui/components/alert";

/**
 * Warns the booker when the slot they picked lands outside business hours on their own clock, which
 * usually means they are booking across a wide timezone gap and may not have noticed.
 *
 * The messages deliberately say "your timezone" rather than interpolating the name of one. i18next
 * is initialised with the default `escapeValue`, so a value like `America/Sao_Paulo` would reach the
 * page as `America&#x2F;Sao_Paulo` - and the timezone is already spelled out in the event details.
 */
export const OutsideBusinessHoursWarning = ({
  startTime,
  durationInMinutes,
  timeZone,
  timeFormat,
}: {
  /** Start of the booking, in ISO format. */
  startTime: string;
  durationInMinutes: number | null;
  timeZone: string;
  timeFormat: TimeFormat;
}) => {
  const { t } = useLocale();

  const reason = getOutsideBusinessHoursReason({ startTime, durationInMinutes, timeZone });
  if (!reason) return null;

  const opensAt = formatBusinessHour(BUSINESS_HOURS.startHour, timeFormat);
  const closesAt = formatBusinessHour(BUSINESS_HOURS.endHour, timeFormat);

  const message = {
    non_business_day: t("outside_business_hours_day_description"),
    before_opening: t("outside_business_hours_time_description", { opensAt, closesAt }),
    after_closing: t("outside_business_hours_time_description", { opensAt, closesAt }),
    ends_after_closing: t("outside_business_hours_end_description", { closesAt }),
  }[reason];

  return (
    <div data-testid="outside-business-hours-warning" role="status">
      <Alert
        className="my-2"
        severity="warning"
        title={t("outside_business_hours_title")}
        message={message}
      />
    </div>
  );
};
