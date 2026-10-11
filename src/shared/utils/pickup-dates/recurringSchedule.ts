import type { BranchSchedule, IsoDate, RecurringDisplayStatus, RecurringOrder } from "@/shared/domain";
import { addDays, weekdayOf } from "./calendarDate";
import { melbourneDateOf } from "./melbourneTime";
import { cutoffFor, isClosedOn } from "./pickupDates";

// Recurring-order date rules (spec 8, AC-R4 to R8). Pure, like the rest of
// this module: `now` is passed in, nothing reads the clock or Firestore.
//
// A pickup date is "locked" once its cutoff (the branch's cutoff time on the
// day before) has passed: from then on its order is made, or will be made,
// from the recurring order as it stood, and only a phone call changes it.

/** The parts of a recurring order its dates depend on. */
export type RecurringSchedule = Pick<
  RecurringOrder,
  "daysOfWeek" | "status" | "startsOn" | "endsOn" | "skipDates" | "generatedThrough"
>;

/** How far ahead C12's upcoming list and the end-date picker look. */
export const RECURRING_HORIZON_DAYS = 70;

/** How many rows C12's upcoming list shows. */
export const UPCOMING_PICKUP_ROWS = 6;

/**
 * The last pickup date whose cutoff has passed: tomorrow once today's cutoff
 * has passed, else today. Today's own cutoff was yesterday, so today is always
 * locked. Closed days don't change this: a date's cutoff is always the day before.
 */
export function lockedThrough(branch: BranchSchedule, now: Date): IsoDate {
  const today = melbourneDateOf(now);
  const tomorrow = addDays(today, 1);
  return now.getTime() >= cutoffFor(branch, tomorrow).getTime() ? tomorrow : today;
}

/** The first pickup date a customer can still change, skip, pause or start (it may be a closed day). */
export function firstChangeableDate(branch: BranchSchedule, now: Date): IsoDate {
  return addDays(lockedThrough(branch, now), 1);
}

/** One of its weekdays, on or after its start, and the branch is open. The end date isn't checked. */
function matchesDay(schedule: RecurringSchedule, branch: BranchSchedule, date: IsoDate): boolean {
  return (
    schedule.daysOfWeek.includes(weekdayOf(date)) &&
    date >= schedule.startsOn &&
    !isClosedOn(branch, date)
  );
}

/** A pickup day of this recurring order: its weekday, between its start and end, and the branch is open. */
export function isScheduledOn(schedule: RecurringSchedule, branch: BranchSchedule, date: IsoDate): boolean {
  return matchesDay(schedule, branch, date) && (schedule.endsOn === null || date <= schedule.endsOn);
}

/** Whether generation makes an order for this date (AC-R8): scheduled, active and not skipped. */
export function wouldGenerate(schedule: RecurringSchedule, branch: BranchSchedule, date: IsoDate): boolean {
  return (
    schedule.status === "active" &&
    isScheduledOn(schedule, branch, date) &&
    !schedule.skipDates.includes(date)
  );
}

/**
 * The dates generation still has to look at, earliest first: after the cursor
 * and up to the last locked date. Never before today (AC-R6: missed dates are
 * not back-filled). Usually one date; two when yesterday's run never happened.
 */
export function dueDates(schedule: RecurringSchedule, branch: BranchSchedule, now: Date): IsoDate[] {
  const today = melbourneDateOf(now);
  const last = lockedThrough(branch, now);
  const afterCursor = schedule.generatedThrough ? addDays(schedule.generatedThrough, 1) : today;
  const dates: IsoDate[] = [];
  for (let date = afterCursor > today ? afterCursor : today; date <= last; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

/** Ended once no new order can be made: the end date is before the first changeable date, or before the start. */
export function isEnded(schedule: RecurringSchedule, branch: BranchSchedule, now: Date): boolean {
  if (schedule.endsOn === null) return false;
  return schedule.endsOn < firstChangeableDate(branch, now) || schedule.endsOn < schedule.startsOn;
}

export function displayStatus(
  schedule: RecurringSchedule,
  branch: BranchSchedule,
  now: Date,
): RecurringDisplayStatus {
  if (isEnded(schedule, branch, now)) return "ended";
  return schedule.status;
}

export type UpcomingPickup =
  /** Its order exists. Only a phone call changes it now. */
  | { date: IsoDate; kind: "made"; orderNumber: string }
  /** The cutoff has passed and the order is about to be made. Only a phone call changes it now. */
  | { date: IsoDate; kind: "closing" }
  /** Skipped; the skip can be undone until the date's cutoff. */
  | { date: IsoDate; kind: "skipped" }
  /** Will be made at the cutoff; can be skipped until then. */
  | { date: IsoDate; kind: "open" };

/**
 * C12's upcoming pickups from today, earliest first (AC-R5, R7). Orders that
 * already exist always show, whatever the recurring order's state now. A
 * paused or ended order shows only those (as designed); an active one adds
 * the days still to come.
 *
 * `made` maps pickup dates to the order numbers generated for them; leave out
 * cancelled orders.
 */
export function upcomingPickups(
  schedule: RecurringSchedule,
  branch: BranchSchedule,
  now: Date,
  made: ReadonlyMap<IsoDate, string>,
  count: number = UPCOMING_PICKUP_ROWS,
): UpcomingPickup[] {
  const today = melbourneDateOf(now);
  const locked = lockedThrough(branch, now);
  const live = schedule.status === "active" && !isEnded(schedule, branch, now);
  const rows: UpcomingPickup[] = [];

  for (let i = 0; i < RECURRING_HORIZON_DAYS && rows.length < count; i += 1) {
    const date = addDays(today, i);
    const orderNumber = made.get(date);
    if (orderNumber !== undefined) {
      rows.push({ date, kind: "made", orderNumber });
    } else if (date <= locked) {
      // Already looked at by generation and nothing was made (skipped, paused), or about to be.
      const looked = schedule.generatedThrough !== null && date <= schedule.generatedThrough;
      if (!looked && wouldGenerate(schedule, branch, date)) rows.push({ date, kind: "closing" });
    } else if (live && isScheduledOn(schedule, branch, date)) {
      rows.push({ date, kind: schedule.skipDates.includes(date) ? "skipped" : "open" });
    }
  }
  return rows;
}

/** The next pickup that will happen (made, closing or still to come, not skipped), or null. For C9 and C10. */
export function nextPickup(
  schedule: RecurringSchedule,
  branch: BranchSchedule,
  now: Date,
  made: ReadonlyMap<IsoDate, string>,
): UpcomingPickup | null {
  const rows = upcomingPickups(schedule, branch, now, made, RECURRING_HORIZON_DAYS);
  return rows.find((row) => row.kind !== "skipped") ?? null;
}

/**
 * The first date on or after `from` that this schedule would make an order
 * for, ignoring pause and skips: "First pickup …", "Changes apply from …",
 * "Your next new order is for …". Null if none within the horizon.
 */
export function firstPickupFrom(
  schedule: Pick<RecurringSchedule, "daysOfWeek" | "startsOn" | "endsOn">,
  branch: BranchSchedule,
  from: IsoDate,
): IsoDate | null {
  const full: RecurringSchedule = { ...schedule, status: "active", skipDates: [], generatedThrough: null };
  for (let i = 0; i < RECURRING_HORIZON_DAYS; i += 1) {
    const date = addDays(from, i);
    if (isScheduledOn(full, branch, date)) return date;
  }
  return null;
}

/**
 * "Stop now" (AC-R7): the last locked date, so an order already made (or
 * about to be) still stands and shows. Before the first pickup it's the day
 * before the start: ended before it began.
 */
export function stopNowEndsOn(
  schedule: Pick<RecurringSchedule, "startsOn">,
  branch: BranchSchedule,
  now: Date,
): IsoDate {
  const locked = lockedThrough(branch, now);
  const dayBeforeStart = addDays(schedule.startsOn, -1);
  return locked > dayBeforeStart ? locked : dayBeforeStart;
}

/**
 * The days "After a pickup day" can end on (AC-R7): this order's own pickup
 * days that can still change, not skipped, within the horizon. The current
 * end date doesn't limit them, so an end can be moved later as well as earlier.
 */
export function endDateOptions(schedule: RecurringSchedule, branch: BranchSchedule, now: Date): IsoDate[] {
  const first = firstChangeableDate(branch, now);
  const from = first > schedule.startsOn ? first : schedule.startsOn;
  const options: IsoDate[] = [];
  for (let i = 0; i < RECURRING_HORIZON_DAYS; i += 1) {
    const date = addDays(from, i);
    if (matchesDay(schedule, branch, date) && !schedule.skipDates.includes(date)) options.push(date);
  }
  return options;
}
