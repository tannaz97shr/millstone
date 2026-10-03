import "server-only";
import type { BranchSchedule, IsoDate } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { pickupCalendar, pickupDateProblem } from "@/shared/utils/pickup-dates";

const DATE_MESSAGES = {
  closed_day: "The branch is closed that day",
  past_cutoff: "Orders for that day have closed",
  out_of_range: "That day is too far ahead to order",
} as const;

/**
 * Throws a 422 ApiError, carrying the earliest orderable date, when `date`
 * can't be ordered from this branch with the server's clock.
 */
export function assertOrderableDate(branch: BranchSchedule, date: IsoDate, now: Date): void {
  const calendar = pickupCalendar(branch, now);
  const problem = pickupDateProblem(calendar, date);
  if (problem) {
    throw new ApiError(422, problem, DATE_MESSAGES[problem], { earliest: calendar.earliest });
  }
}
