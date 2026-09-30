import type { IsoDate, Weekday } from "@/shared/domain";
import { addDays, isoDateToUtc, toIsoDate } from "./calendarDate";

// Weekday and month names for the date components. Every name comes from Intl
// and a real date; nothing here is a hardcoded name string. en-US is used for
// the same reason as formatPickupDay: en-AU prints "Sept".

const LOCALE = "en-US";

/** A Sunday, so adding a weekday number lands on that weekday. */
const A_SUNDAY = toIsoDate("2023-01-01");

const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options });

const weekdayFormatters = {
  short: formatter({ weekday: "short" }),
  long: formatter({ weekday: "long" }),
};
const longDayFormatter = formatter({ weekday: "long", day: "numeric", month: "long" });
const monthTitleFormatter = formatter({ month: "long", year: "numeric" });
const monthShortFormatter = formatter({ month: "short" });

function partsOf(format: Intl.DateTimeFormat, date: IsoDate) {
  const parts = format.formatToParts(isoDateToUtc(date));
  return (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
}

/** "Tue" or "Tuesday" for a weekday number (0 = Sunday). */
export function weekdayName(weekday: Weekday, length: "short" | "long" = "short"): string {
  return weekdayFormatters[length].format(isoDateToUtc(addDays(A_SUNDAY, weekday)));
}

/** "Wednesday 30 September": the spoken form, for screen-reader labels. */
export function formatLongDay(date: IsoDate): string {
  const part = partsOf(longDayFormatter, date);
  return `${part("weekday")} ${part("day")} ${part("month")}`;
}

/** "September 2026". */
export function formatMonthTitle(date: IsoDate): string {
  const part = partsOf(monthTitleFormatter, date);
  return `${part("month")} ${part("year")}`;
}

/** "Sep". */
export function monthShortName(date: IsoDate): string {
  return monthShortFormatter.format(isoDateToUtc(date));
}
