import type { IsoDate, TimeOfDay, Weekday } from "@/shared/domain";
import { listNames } from "../listNames";
import { addDays, isoDateToUtc, timeOfDayParts, toIsoDate } from "./calendarDate";

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

/** "Mondays" or "Sundays and Mondays", in week order from Sunday. */
export function formatWeekdayList(weekdays: readonly Weekday[]): string {
  const sorted = [...new Set(weekdays)].sort((a, b) => a - b);
  return listNames(sorted.map((day) => `${weekdayName(day, "long")}s`));
}

/** "2pm", "7:30am", "12pm" (noon), "12am" (midnight). */
export function formatTimeOfDay(time: TimeOfDay): string {
  const { hour, minute } = timeOfDayParts(time);
  const suffix = hour < 12 ? "am" : "pm";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minutes = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
  return `${hour12}${minutes}${suffix}`;
}

/** "Sep". */
export function monthShortName(date: IsoDate): string {
  return monthShortFormatter.format(isoDateToUtc(date));
}
