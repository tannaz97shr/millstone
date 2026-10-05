import type { AvailabilityState, BranchProduct, IsoDate } from "@/shared/domain";
import { type PickupCalendar, type PickupDateProblem, pickupDateProblem } from "@/shared/utils/pickup-dates";
import type { AvailabilityCategory, AvailabilityProduct } from "../types/availability";

// Pure: what A4 shows for a product at a branch, and what each action does to
// it. No Firestore, no clock: `today` and the calendar come from the caller.

/** How many days the "Mark sold out for" picker shows, from the earliest (Availability.dc.html). */
export const AVAILABILITY_PICKER_DAYS = 7;

/**
 * The sold-out date while it still applies: after today (Melbourne). Spec 4:
 * it stops applying once the date passes, with no cleanup job.
 */
export function currentSoldOutDate(soldOutOn: IsoDate | null, today: IsoDate): IsoDate | null {
  return soldOutOn !== null && soldOutOn > today ? soldOutOn : null;
}

/** A missing row is on the menu and not sold out (spec 4). */
export function availabilityState(
  row: Pick<BranchProduct, "isAvailable" | "soldOutOn"> | undefined,
  today: IsoDate,
): AvailabilityState {
  if (!row) return { isAvailable: true, soldOutOn: null };
  return { isAvailable: row.isAvailable, soldOutOn: currentSoldOutDate(row.soldOutOn, today) };
}

export function sameAvailability(a: AvailabilityState, b: AvailabilityState): boolean {
  return a.isAvailable === b.isAvailable && a.soldOutOn === b.soldOutOn;
}

/** Shown as sold out: on the menu here and sold out for a day still to come. */
export function isShownSoldOut(state: AvailabilityState): boolean {
  return state.isAvailable && state.soldOutOn !== null;
}

export type AvailabilityChange =
  | { action: "switch_on" }
  | { action: "switch_off" }
  | { action: "mark_sold_out"; date: IsoDate }
  | { action: "back_on_sale" };

export type AvailabilityPlan =
  | { ok: true; state: AvailabilityState }
  /** The row's state never allows this, e.g. switching on a product that's on. */
  | { ok: false; problem: "not_allowed" }
  /** Sold out for a day that can't be ordered. */
  | { ok: false; problem: PickupDateProblem };

/**
 * The row after one action. Switching off keeps a sold-out date, so switching
 * back on the same day still shows it. As on the canvas, a product sold out
 * for one day has to go back on sale before it's marked for another.
 */
export function planAvailabilityAction(
  current: AvailabilityState,
  change: AvailabilityChange,
  calendar: PickupCalendar,
): AvailabilityPlan {
  switch (change.action) {
    case "switch_on":
      return current.isAvailable ? { ok: false, problem: "not_allowed" } : { ok: true, state: { ...current, isAvailable: true } };
    case "switch_off":
      return current.isAvailable ? { ok: true, state: { ...current, isAvailable: false } } : { ok: false, problem: "not_allowed" };
    case "mark_sold_out": {
      if (!current.isAvailable || current.soldOutOn !== null) return { ok: false, problem: "not_allowed" };
      const problem = pickupDateProblem(calendar, change.date);
      if (problem) return { ok: false, problem };
      return { ok: true, state: { isAvailable: true, soldOutOn: change.date } };
    }
    case "back_on_sale":
      return current.soldOutOn === null ? { ok: false, problem: "not_allowed" } : { ok: true, state: { ...current, soldOutOn: null } };
  }
}

export interface AvailabilityCounts {
  products: number;
  on: number;
  off: number;
  /** On the menu here and sold out for a day still to come. */
  soldOut: number;
}

export function availabilityCounts(products: readonly AvailabilityProduct[]): AvailabilityCounts {
  const off = products.filter((p) => !p.state.isAvailable).length;
  return {
    products: products.length,
    on: products.length - off,
    off,
    soldOut: products.filter((p) => isShownSoldOut(p.state)).length,
  };
}

export function allProducts(categories: readonly AvailabilityCategory[]): AvailabilityProduct[] {
  return categories.flatMap((category) => category.products);
}

/** A copy of the categories with one product's state replaced. */
export function withProductState(
  categories: readonly AvailabilityCategory[],
  productId: AvailabilityProduct["id"],
  state: AvailabilityState,
): AvailabilityCategory[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) => (product.id === productId ? { ...product, state } : product)),
  }));
}
