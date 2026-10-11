import type { BranchSchedule, IsoDate, ProductId, RecurringOrder } from "@/shared/domain";
import type { ApiErrorCode, UnavailableItem } from "@/shared/lib/api/apiError";
import {
  earliestPickupDate,
  firstChangeableDate,
  isClosedOn,
  isEnded,
  isScheduledOn,
  lockedThrough,
  melbourneDateOf,
  stopNowEndsOn,
  weekdayOf,
} from "@/shared/utils/pickup-dates";
import { MAX_SKIP_DATES, type RecurringActionRequest, type UpdateRecurringRequest } from "./recurringSchemas";

// What a customer's change does to a recurring order (AC-R4 to R7). Pure:
// the routes read the recurring order and branch in a transaction, after
// generating anything already due, and write the changes this returns.
//
// Every date rule uses the branch's cutoff: a pickup day can be changed,
// skipped or brought back until the cutoff the day before; after that its
// order exists (or is about to) and only a call to the branch changes it.

export type RecurringChanges = Partial<
  Pick<RecurringOrder, "status" | "daysOfWeek" | "items" | "startsOn" | "endsOn" | "notes" | "skipDates">
>;

export type ChangePlan =
  | { kind: "change"; changes: RecurringChanges }
  | {
      kind: "refused";
      status: 409 | 422;
      code: ApiErrorCode;
      message: string;
      earliest?: IsoDate;
      items?: UnavailableItem[];
    };

const refuse = (
  status: 409 | 422,
  code: ApiErrorCode,
  message: string,
  extra: { earliest?: IsoDate; items?: UnavailableItem[] } = {},
): ChangePlan => ({ kind: "refused", status, code, message, ...extra });

const changed = (expectedVersion: number, recurringOrder: RecurringOrder): ChangePlan | null =>
  expectedVersion === recurringOrder.version
    ? null
    : refuse(409, "recurring_changed", `Recurring order is at version ${recurringOrder.version}, not ${expectedVersion}`);

/** Skips still to come, without any the new days no longer cover, capped. */
function keptSkips(skipDates: readonly IsoDate[], keep: (date: IsoDate) => boolean, today: IsoDate): IsoDate[] {
  return [...new Set(skipDates)]
    .filter((date) => date >= today && keep(date))
    .sort()
    .slice(0, MAX_SKIP_DATES);
}

/** Whether a start date can be changed: only until its first pickup's cutoff (Q13). */
export function hasStarted(recurringOrder: Pick<RecurringOrder, "startsOn">, branch: BranchSchedule, now: Date): boolean {
  return recurringOrder.startsOn <= lockedThrough(branch, now);
}

export interface CheckFieldsInput {
  branch: BranchSchedule;
  daysOfWeek: RecurringOrder["daysOfWeek"];
  items: RecurringOrder["items"];
  startsOn: IsoDate;
  endsOn: IsoDate | null;
  /** Products on the branch's menu now (active and not switched off there). */
  onMenu: ReadonlySet<ProductId>;
  /** Product names, for naming the ones that can't be added. */
  names: ReadonlyMap<ProductId, string>;
  /** Products already in the recurring order: they may stay even if they've left the menu (AC-P2). */
  alreadyIn: ReadonlySet<ProductId>;
  /** Check the start against the earliest pickup (a new order, or one not started yet). */
  checkStart: boolean;
  /** Check the end date (it's new or moved). */
  checkEnd: boolean;
  now: Date;
}

/** The rules C11 can't check in the browser: closed days, the earliest start, the menu, the end day. */
export function checkFields(input: CheckFieldsInput): ChangePlan | null {
  const { branch, daysOfWeek, items, startsOn, endsOn, onMenu, names, alreadyIn, now } = input;

  const closed = daysOfWeek.filter((day) => branch.closedDays.includes(day));
  if (closed.length > 0) return refuse(422, "closed_day", `The branch is closed on weekday ${closed.join(", ")}`);

  const unavailable = items
    .filter((item) => !onMenu.has(item.productId) && !alreadyIn.has(item.productId))
    .map((item): UnavailableItem => ({
      productId: item.productId,
      name: names.get(item.productId) ?? item.productId,
      reason: "not_available",
    }));
  if (unavailable.length > 0) {
    return refuse(422, "items_unavailable", "Some items aren't on the branch's menu", { items: unavailable });
  }

  if (input.checkStart) {
    const earliest = earliestPickupDate(branch, now);
    if (startsOn < earliest) return refuse(422, "start_too_early", `The earliest start is ${earliest}`, { earliest });
  }

  if (input.checkEnd && endsOn !== null) {
    const schedule = { daysOfWeek, startsOn, endsOn: null, status: "active" as const, skipDates: [], generatedThrough: null };
    if (endsOn < firstChangeableDate(branch, now)) {
      return refuse(409, "date_locked", `Orders for ${endsOn} have closed`);
    }
    if (!isScheduledOn(schedule, branch, endsOn)) {
      return refuse(422, "not_scheduled", `${endsOn} isn't one of this order's pickup days`);
    }
  }
  return null;
}

export interface PlanEditInput {
  recurringOrder: RecurringOrder;
  branch: BranchSchedule;
  request: UpdateRecurringRequest;
  onMenu: ReadonlySet<ProductId>;
  names: ReadonlyMap<ProductId, string>;
  now: Date;
}

/**
 * C11 edit (AC-R4): days, items, notes and the end date, and the start until
 * the first pickup. Changes apply from the first changeable date; orders
 * already made are never touched. Skips on days no longer chosen are dropped.
 */
export function planEdit({ recurringOrder, branch, request, onMenu, names, now }: PlanEditInput): ChangePlan {
  const stale = changed(request.expectedVersion, recurringOrder);
  if (stale) return stale;
  if (isEnded(recurringOrder, branch, now)) {
    return refuse(409, "not_allowed", "This recurring order has ended");
  }

  const started = hasStarted(recurringOrder, branch, now);
  const startsOn = started ? recurringOrder.startsOn : request.startsOn;
  const endMoved = request.endsOn !== recurringOrder.endsOn;
  const problem = checkFields({
    branch,
    daysOfWeek: request.daysOfWeek,
    items: request.items,
    startsOn,
    endsOn: request.endsOn,
    onMenu,
    names,
    alreadyIn: new Set(recurringOrder.items.map((item) => item.productId)),
    checkStart: !started && request.startsOn !== recurringOrder.startsOn,
    checkEnd: endMoved,
    now,
  });
  if (problem) return problem;
  if (request.endsOn !== null && request.endsOn < startsOn) {
    return refuse(422, "not_scheduled", "The end date is before the start");
  }

  const today = melbourneDateOf(now);
  const days = new Set(request.daysOfWeek);
  return {
    kind: "change",
    changes: {
      daysOfWeek: [...request.daysOfWeek],
      items: request.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      startsOn,
      endsOn: request.endsOn,
      notes: request.notes,
      skipDates: keptSkips(recurringOrder.skipDates, (date) => days.has(weekdayOf(date)) && !isClosedOn(branch, date), today),
    },
  };
}

export interface PlanActionInput {
  recurringOrder: RecurringOrder;
  branch: BranchSchedule;
  request: RecurringActionRequest;
  now: Date;
}

/** C12's actions: pause, resume (AC-R6), skip and undo (AC-R5), and end (AC-R7). */
export function planAction({ recurringOrder, branch, request, now }: PlanActionInput): ChangePlan {
  const stale = changed(request.expectedVersion, recurringOrder);
  if (stale) return stale;
  if (isEnded(recurringOrder, branch, now)) {
    return refuse(409, "not_allowed", "This recurring order has ended");
  }

  const today = melbourneDateOf(now);
  const firstChangeable = firstChangeableDate(branch, now);
  const skips = (dates: readonly IsoDate[]) => keptSkips(dates, () => true, today);

  switch (request.action) {
    case "pause":
      if (recurringOrder.status === "paused") return refuse(409, "not_allowed", "Already paused");
      return { kind: "change", changes: { status: "paused", skipDates: skips(recurringOrder.skipDates) } };

    case "resume":
      // Generation restarts from the first changeable date; the cursor
      // already covers every locked date, so nothing is back-filled (AC-R6).
      if (recurringOrder.status === "active") return refuse(409, "not_allowed", "Not paused");
      return { kind: "change", changes: { status: "active", skipDates: skips(recurringOrder.skipDates) } };

    case "skip": {
      if (recurringOrder.status !== "active") return refuse(409, "not_allowed", "Paused orders have no days to skip");
      if (request.date < firstChangeable) return refuse(409, "date_locked", `Orders for ${request.date} have closed`);
      if (!isScheduledOn(recurringOrder, branch, request.date)) {
        return refuse(409, "not_scheduled", `${request.date} isn't one of this order's pickup days`);
      }
      return { kind: "change", changes: { skipDates: skips([...recurringOrder.skipDates, request.date]) } };
    }

    case "unskip": {
      if (!recurringOrder.skipDates.includes(request.date)) {
        return refuse(409, "not_scheduled", `${request.date} isn't skipped`);
      }
      if (request.date < firstChangeable) return refuse(409, "date_locked", `Orders for ${request.date} have closed`);
      return {
        kind: "change",
        changes: { skipDates: skips(recurringOrder.skipDates.filter((date) => date !== request.date)) },
      };
    }

    case "end_now":
      return {
        kind: "change",
        changes: { endsOn: stopNowEndsOn(recurringOrder, branch, now), skipDates: skips(recurringOrder.skipDates) },
      };

    case "end_after": {
      if (request.date < firstChangeable) return refuse(409, "date_locked", `Orders for ${request.date} have closed`);
      const open = { ...recurringOrder, endsOn: null };
      if (!isScheduledOn(open, branch, request.date) || recurringOrder.skipDates.includes(request.date)) {
        return refuse(409, "not_scheduled", `${request.date} isn't one of this order's pickup days`);
      }
      return { kind: "change", changes: { endsOn: request.date, skipDates: skips(recurringOrder.skipDates) } };
    }
  }
}
