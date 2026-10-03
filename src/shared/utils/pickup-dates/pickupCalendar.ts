import type { BranchSchedule, IsoDate } from "@/shared/domain";
import { addDays } from "./calendarDate";
import { melbourneDateOf, melbourneWallTimeToInstant } from "./melbourneTime";
import { earliestPickupDate, isOrderableDate } from "./pickupDates";

/** How many day tiles the customer's date strip shows. */
export const PICKUP_STRIP_DAYS = 14;

/**
 * Everything the customer's date strip needs, worked out with the server's
 * clock so the browser never decides a cutoff itself.
 */
export interface PickupCalendar {
  earliest: IsoDate;
  /**
   * The first tile of the strip: always tomorrow (Melbourne), so after the
   * cutoff the day that was missed still shows, struck through (AfterCutoff).
   */
  stripStart: IsoDate;
  stripDays: number;
  /** The strip's days that can be ordered, earliest first. Never empty in practice: a branch is open at least one weekday. */
  orderableDates: IsoDate[];
  /** Today's cutoff has passed, so tomorrow can no longer be ordered. */
  pastTodaysCutoff: boolean;
}

/** True from the cutoff time today (Melbourne) until midnight. */
export function isPastTodaysCutoff(branch: BranchSchedule, now: Date): boolean {
  const cutoffToday = melbourneWallTimeToInstant(melbourneDateOf(now), branch.orderCutoffTime);
  return now.getTime() >= cutoffToday.getTime();
}

export function pickupCalendar(
  branch: BranchSchedule,
  now: Date,
  days: number = PICKUP_STRIP_DAYS,
): PickupCalendar {
  const earliest = earliestPickupDate(branch, now);
  const stripStart = addDays(melbourneDateOf(now), 1);
  const strip = Array.from({ length: days }, (_, i) => addDays(stripStart, i));
  return {
    earliest,
    stripStart,
    stripDays: days,
    orderableDates: strip.filter((date) => isOrderableDate(branch, date, now)),
    pastTodaysCutoff: isPastTodaysCutoff(branch, now),
  };
}

export type PickupDateProblem = "closed_day" | "past_cutoff" | "out_of_range";

/**
 * Why a date can't be ordered on this calendar, or null when it can.
 * Before the earliest date it's past its cutoff (even if also a closed day);
 * after the strip it's too far ahead; a day inside the strip that still
 * can't be ordered is one the branch is closed.
 */
export function pickupDateProblem(
  calendar: PickupCalendar,
  date: IsoDate,
): PickupDateProblem | null {
  if (calendar.orderableDates.includes(date)) return null;
  if (date < calendar.earliest) return "past_cutoff";
  if (date > addDays(calendar.stripStart, calendar.stripDays - 1)) return "out_of_range";
  return "closed_day";
}
