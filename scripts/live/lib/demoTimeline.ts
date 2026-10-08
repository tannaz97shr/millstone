import type { CancellationReason, IsoDate, OrderStatus } from "@/shared/domain";
import { addDays, melbourneDateOf, melbourneWallTimeToInstant, toTimeOfDay } from "@/shared/utils/pickup-dates";

// When the demo orders' events happen (scripts/live/demoOrders.ts). Pure, so
// the rules are unit-tested: times are Melbourne wall-clock times relative to
// each order's pickup day, and nothing is ever dated after `now`.

const DEMO_ID_PREFIX = "demo-";

/** demo-2026-10-08-nc-1: the prefix marks demo data; the date keeps each day's set apart. */
export const demoOrderId = (pickupDate: IsoDate, key: string) => `${DEMO_ID_PREFIX}${pickupDate}-${key}`;
export const isDemoOrderId = (id: string) => id.startsWith(DEMO_ID_PREFIX);

export interface DemoStamp {
  /** Calendar days from the pickup day, e.g. -1 for the day before. */
  daysFrom: number;
  /** "HH:mm", Melbourne. */
  time: string;
}

/** A staff action on the pickup day, at a Melbourne time ("HH:mm"). */
export type DemoStep =
  | { action: "ready"; at: string }
  | { action: "collect"; at: string }
  | { action: "cancel"; at: string; reason: CancellationReason; note?: string };

const STEP_RESULT: Record<DemoStep["action"], OrderStatus> = {
  ready: "ready",
  collect: "collected",
  cancel: "cancelled",
};

export function stampInstant(pickupDate: IsoDate, stamp: DemoStamp): Date {
  return melbourneWallTimeToInstant(addDays(pickupDate, stamp.daysFrom), toTimeOfDay(stamp.time));
}

/**
 * When the order was placed: the stamp, or a few minutes before `now` if the
 * stamp hasn't come yet (`index` keeps clamped orders a minute apart, in order).
 */
export function placedAt(pickupDate: IsoDate, stamp: DemoStamp, now: Date, index: number): Date {
  const wanted = stampInstant(pickupDate, stamp);
  const latest = new Date(now.getTime() - (60 - index) * 60_000);
  return wanted.getTime() <= latest.getTime() ? wanted : latest;
}

/**
 * The steps still to apply to an order now `status`, in order, or null when
 * the order has moved off its script (someone changed it by hand): then it's
 * left alone.
 */
export function remainingSteps(steps: readonly DemoStep[], status: OrderStatus): DemoStep[] | null {
  if (status === "placed") return [...steps];
  const done = steps.findIndex((step) => STEP_RESULT[step.action] === status);
  return done === -1 ? null : steps.slice(done + 1);
}

/**
 * The steps whose time has come, in order, stopping at the first that hasn't.
 * Only on the pickup day itself: a branch whose demo "today" is a later open
 * day keeps its orders placed.
 */
export function dueSteps(steps: readonly DemoStep[], pickupDate: IsoDate, now: Date): DemoStep[] {
  if (melbourneDateOf(now) !== pickupDate) return [];
  const due: DemoStep[] = [];
  for (const step of steps) {
    if (stampInstant(pickupDate, { daysFrom: 0, time: step.at }).getTime() > now.getTime()) break;
    due.push(step);
  }
  return due;
}
