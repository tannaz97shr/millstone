import { branchIdParam, pickupDateParam } from "@/modules/branches/lib/branchParams";
import type { BranchId, IsoDate } from "@/shared/domain";
import type { AvailabilityCalendar } from "../types/availability";

// A4's view lives in the URL (?branch=&date=), as A2's filters do, so a
// reload or a trip through A1 comes back to the same branch and day.

export interface AvailabilityView {
  /** The owner's chosen branch; null is the default (the first branch). Staff never set it. */
  branch: BranchId | null;
  /** The "Mark sold out for" day; null is the earliest. */
  date: IsoDate | null;
}

type ParamsSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamsSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Lenient: anything unreadable is the default. */
export function availabilityViewFromUrl(source: ParamsSource): AvailabilityView {
  const branch = branchIdParam.safeParse(read(source, "branch"));
  const date = pickupDateParam.safeParse(read(source, "date"));
  return { branch: branch.success ? branch.data : null, date: date.success ? date.data : null };
}

export function availabilityViewToQuery(view: AvailabilityView): Record<string, string> {
  const out: Record<string, string> = {};
  if (view.branch) out.branch = view.branch;
  if (view.date) out.date = view.date;
  return out;
}

/** The chosen day if the picker can mark it, else the earliest (the default, AC-P5). */
export function soldOutDateFor(chosen: IsoDate | null, calendar: AvailabilityCalendar): IsoDate {
  return chosen && calendar.orderableDates.includes(chosen) ? chosen : calendar.earliest;
}
