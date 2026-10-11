import type { IsoDate, TimeOfDay, Weekday } from "@/shared/domain";
import { listNames } from "@/shared/utils/listNames";
import {
  addDays,
  formatPickupDay,
  formatTimeOfDay,
  weekdayName,
  type UpcomingPickup,
} from "@/shared/utils/pickup-dates";
import { recurringContent } from "../content/recurringContent";
import type {
  RecurringBranchView,
  RecurringOrderDetail,
  RecurringOrderSummary,
  RecurringOrdersResponse,
} from "../types/recurringOrderView";

// The words C9 to C12 build from a recurring order (AccountArea.dc.html).
// Pure: "today" always comes from the server's answer, never the browser's clock.

const content = recurringContent;

/** The designs list days in the bakery's week: Monday first, Sunday last. */
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0] as Weekday[];

/** "Tue, Thu and Sat". */
export function daysText(days: readonly Weekday[]): string {
  return listNames(WEEK_ORDER.filter((day) => days.includes(day)).map((day) => weekdayName(day)));
}

/** "Today, Sun 11 Oct" or "Tue 13 Oct". */
export function dayLabel(date: IsoDate, today: IsoDate): string {
  const day = formatPickupDay(date);
  return date === today ? content.common.today(day) : day;
}

/** ["12 × Plain bagel", "6 × Almond croissant"]. */
export function itemLines(items: readonly { quantity: number; name: string }[]): string[] {
  return items.map((item) => content.common.line(item.quantity, item.name));
}

/** "2pm Mon 12 Oct": when a pickup date's cutoff falls (the day before). */
export function cutoffBefore(date: IsoDate, cutoffTime: TimeOfDay): string {
  return `${formatTimeOfDay(cutoffTime)} ${formatPickupDay(addDays(date, -1))}`;
}

/** "2pm" when every branch closes orders at the same time, else null. */
export function sharedCutoff(branches: readonly { orderCutoffTime: TimeOfDay }[]): string | null {
  const times = new Set(branches.map((branch) => branch.orderCutoffTime));
  return times.size === 1 ? formatTimeOfDay(branches[0].orderCutoffTime) : null;
}

/** C10's line under the items. */
export function nextLine(summary: RecurringOrderSummary, today: IsoDate): string {
  const text = content.list.next;
  if (summary.status === "ended") return text.ended;
  const { next } = summary;
  if (summary.status === "paused") {
    return next?.kind === "made" ? text.pausedMade(dayLabel(next.date, today), next.orderNumber) : text.paused;
  }
  const line = next ? text.next(dayLabel(next.date, today)) : text.none;
  return summary.endsOn ? line + text.lastPickup(formatPickupDay(summary.endsOn)) : line;
}

/** C9's sentence: how many live recurring orders, and the soonest pickup across them. */
export function accountSummary({ recurringOrders, today }: RecurringOrdersResponse): string {
  const live = recurringOrders.filter((summary) => summary.status !== "ended");
  if (live.length === 0) return content.account.empty;
  const dates = live
    .map((summary) => summary.next)
    .filter((next): next is UpcomingPickup => next !== null && next.kind !== "skipped")
    .map((next) => next.date)
    .sort();
  return content.account.summary(content.account.count(live.length), dates[0] ? dayLabel(dates[0], today) : null);
}

/** What one C12 row says under its date: plain words, or words ending in the branch's phone. */
export type RowCaption = { kind: "text"; text: string } | { kind: "call"; before: string };

export function rowCaption(row: UpcomingPickup, branch: RecurringBranchView): RowCaption {
  const text = content.detail;
  switch (row.kind) {
    case "made":
      return { kind: "call", before: text.made(row.orderNumber, branch.name) };
    case "closing":
      return { kind: "call", before: text.closing(cutoffBefore(row.date, branch.orderCutoffTime), branch.name) };
    case "skipped":
      return { kind: "text", text: text.skipped(cutoffBefore(row.date, branch.orderCutoffTime)) };
    case "open":
      return { kind: "text", text: text.open(cutoffBefore(row.date, branch.orderCutoffTime)) };
  }
}

/** C12's ended box: "Ended after Sat 17 Oct", or before it began ("Stop now" before the first pickup). */
export function endedTitle(detail: Pick<RecurringOrderDetail, "startsOn" | "endsOn">): string {
  if (detail.endsOn === null) return content.detail.endedTitle("");
  return detail.endsOn < detail.startsOn
    ? content.detail.endedBeforeStart
    : content.detail.endedTitle(formatPickupDay(detail.endsOn));
}

/** The line under C12's upcoming rows: always for paused and ended (as designed), else only when there are none. */
export function noUpcomingText(detail: Pick<RecurringOrderDetail, "status" | "upcoming">): string | null {
  const text = content.detail.noUpcoming;
  if (detail.status === "ended") return text.ended;
  if (detail.status === "paused") return text.paused;
  return detail.upcoming.length === 0 ? text.none : null;
}

export type EndChoice = "now" | "date";

/** The end sheet's danger button says what it will do. */
export function endConfirmLabel(choice: EndChoice, date: IsoDate | null): string {
  if (choice === "now") return content.end.confirmNow;
  return date ? content.end.confirmAfter(formatPickupDay(date)) : content.end.chooseDay;
}

/** C12's "Ends" value. */
export function endsLabel(endsOn: IsoDate | null): string {
  return endsOn ? content.detail.endsAfter(formatPickupDay(endsOn)) : content.detail.noEnd;
}
