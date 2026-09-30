import type { Branch, BranchProduct, BranchSchedule, IsoDate } from "@/shared/domain";
import { addDays, isoDateToUtc, weekdayOf } from "./calendarDate";
import { melbourneDateOf, melbourneWallTimeToInstant } from "./melbourneTime";

// The one place pickup-date rules live (spec AC-C3, AC-R8). Pure functions:
// `now` is always passed in, nothing reads the clock or Firestore.

/** Give up after a full year without a single orderable day. */
const MAX_CONSECUTIVE_CLOSED_DAYS = 366;

/** Orders for `pickupDate` close at the branch cutoff on the day before, Melbourne time. */
export function cutoffFor(branch: BranchSchedule, pickupDate: IsoDate): Date {
  return melbourneWallTimeToInstant(addDays(pickupDate, -1), branch.orderCutoffTime);
}

export function isClosedOn(branch: Pick<Branch, "closedDays">, date: IsoDate): boolean {
  return branch.closedDays.includes(weekdayOf(date));
}

/** Open that day and its cutoff hasn't passed. The cutoff moment itself counts as passed. */
export function isOrderableDate(branch: BranchSchedule, date: IsoDate, now: Date): boolean {
  return !isClosedOn(branch, date) && now.getTime() < cutoffFor(branch, date).getTime();
}

/** The next `count` orderable pickup dates, earliest first. */
export function availablePickupDates(
  branch: BranchSchedule,
  now: Date,
  count: number,
): IsoDate[] {
  const dates: IsoDate[] = [];
  let date = melbourneDateOf(now);
  let missesInARow = 0;
  while (dates.length < count) {
    if (isOrderableDate(branch, date, now)) {
      dates.push(date);
      missesInARow = 0;
    } else if (++missesInARow > MAX_CONSECUTIVE_CLOSED_DAYS) {
      throw new Error("Branch has no orderable pickup dates; check its closed days");
    }
    date = addDays(date, 1);
  }
  return dates;
}

export function earliestPickupDate(branch: BranchSchedule, now: Date): IsoDate {
  return availablePickupDates(branch, now, 1)[0];
}

export function isSoldOut(branchProduct: Pick<BranchProduct, "soldOutOn">, date: IsoDate): boolean {
  return branchProduct.soldOutOn === date;
}

// en-US gives "Sep"; en-AU and en-GB now print "Sept". The order is assembled
// by hand so it reads "Wed 30 Sep" regardless of locale punctuation.
const pickupDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "Wed 30 Sep". The weekday always comes from the date itself. */
export function formatPickupDay(date: IsoDate): string {
  const parts = pickupDayFormatter.formatToParts(isoDateToUtc(date));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")}`;
}
