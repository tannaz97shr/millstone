import type { ApiFailure } from "@/shared/lib/http/apiClient";
import type { IsoDate } from "@/shared/domain";
import { listNames } from "@/shared/utils/listNames";
import { formatPickupDay, formatWeekdayList } from "@/shared/utils/pickup-dates";
import { recurringContent } from "../content/recurringContent";
import type { RecurringBranchView } from "../types/recurringOrderView";
import { MAX_LIVE_RECURRING_ORDERS } from "./recurringSchemas";

// What C11 and C12 say when the API refuses a change (undesigned wording,
// specs/known-issues.md). Pure, so every code is unit-tested.

const text = recurringContent.problems;

export interface ProblemContext {
  branch: Pick<RecurringBranchView, "name" | "phone" | "closedDays">;
  /** The day the change was about (skip, undo, end after), when there was one. */
  date?: IsoDate | null;
  /** The recurring order is paused (a refused skip says "Resume first"). */
  paused?: boolean;
}

export interface RecurringProblem {
  /** The message. With `callPhone`, it ends in the branch's phone as a link. */
  text: string;
  callPhone?: string;
  /** The recurring order changed under the screen: load it again. */
  refetch: boolean;
  /** Expected refusals are logged as warnings; anything else as an error. */
  expected: boolean;
}

export function recurringProblem(failure: Pick<ApiFailure, "code" | "earliest" | "items">, ctx: ProblemContext): RecurringProblem {
  const plain = (message: string, refetch = false): RecurringProblem => ({ text: message, refetch, expected: true });
  switch (failure.code) {
    case "recurring_changed":
      return plain(text.changed, true);
    case "date_locked":
      return {
        text: text.dateLocked(ctx.date ? formatPickupDay(ctx.date) : null, ctx.branch.name),
        callPhone: ctx.branch.phone,
        refetch: true,
        expected: true,
      };
    case "not_allowed":
      return plain(ctx.paused ? text.paused : text.ended, true);
    case "closed_day":
      return plain(text.closedDay(ctx.branch.name, formatWeekdayList(ctx.branch.closedDays)));
    case "items_unavailable":
      return plain(text.itemsUnavailable(listNames((failure.items ?? []).map((item) => item.name)), ctx.branch.name));
    case "start_too_early":
      return plain(failure.earliest ? text.startTooEarly(formatPickupDay(failure.earliest)) : text.tryAgain);
    case "not_scheduled":
      return plain(text.notScheduled, true);
    case "limit_reached":
      return plain(text.limitReached(MAX_LIVE_RECURRING_ORDERS));
    case "rate_limited":
      return plain(text.rateLimited);
    case "try_again":
    case "unavailable":
      return plain(text.tryAgain, true);
    case "not_found":
      return { text: text.failed, refetch: true, expected: false };
    default:
      return { text: text.failed, refetch: false, expected: false };
  }
}
