import type { IsoDate, TimeOfDay, Weekday } from "@/shared/domain";

// Calendar arithmetic on "YYYY-MM-DD" strings. Everything here runs in UTC,
// where there is no daylight saving, so adding a day is always exactly a day.

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const utc = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    utc.getUTCFullYear() === Number(y) &&
    utc.getUTCMonth() === Number(m) - 1 &&
    utc.getUTCDate() === Number(d)
  );
}

export function toIsoDate(value: string): IsoDate {
  if (!isIsoDate(value)) {
    throw new Error(`Expected a calendar date "YYYY-MM-DD", got "${value}"`);
  }
  return value;
}

export function isTimeOfDay(value: string): value is TimeOfDay {
  return TIME_OF_DAY_PATTERN.test(value);
}

export function toTimeOfDay(value: string): TimeOfDay {
  if (!isTimeOfDay(value)) {
    throw new Error(`Expected a time "HH:mm", got "${value}"`);
  }
  return value;
}

/** Hours and minutes of a "HH:mm" time. */
export function timeOfDayParts(time: TimeOfDay): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

/** The date as midnight UTC, for arithmetic and Intl formatting only. */
export function isoDateToUtc(date: IsoDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToIsoDate(utc: Date): IsoDate {
  return toIsoDate(utc.toISOString().slice(0, 10));
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return utcToIsoDate(new Date(isoDateToUtc(date).getTime() + days * MS_PER_DAY));
}

export function weekdayOf(date: IsoDate): Weekday {
  return isoDateToUtc(date).getUTCDay() as Weekday;
}

/** The first day of the date's month. */
export function startOfMonth(date: IsoDate): IsoDate {
  return toIsoDate(`${date.slice(0, 7)}-01`);
}

export function daysInMonth(date: IsoDate): number {
  const [y, m] = date.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function dayOfMonth(date: IsoDate): number {
  return Number(date.slice(8, 10));
}

/** Same day in another month; a day the target month doesn't have becomes its last day (31 Jan + 1 → 28 Feb). */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const [y, m] = date.split("-").map(Number);
  const first = utcToIsoDate(new Date(Date.UTC(y, m - 1 + months, 1)));
  const day = Math.min(dayOfMonth(date), daysInMonth(first));
  return toIsoDate(`${first.slice(0, 8)}${String(day).padStart(2, "0")}`);
}
