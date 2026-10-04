import type { AvailabilityState, BranchId, IsoDate, ProductId, TimeOfDay, Weekday } from "@/shared/domain";

export interface AvailabilityProduct {
  id: ProductId;
  name: string;
  state: AvailabilityState;
}

export interface AvailabilityCategory {
  name: string;
  /** For the heading's ID, e.g. "breads". */
  slug: string;
  /** A–Z. */
  products: AvailabilityProduct[];
}

export interface AvailabilityBranchOption {
  id: BranchId;
  name: string;
}

/** What the "Mark sold out for" picker needs, worked out with the server's clock. */
export interface AvailabilityCalendar {
  /** Melbourne today. A sold-out date on or before it has passed. */
  today: IsoDate;
  /** The first tile, and the default date. */
  earliest: IsoDate;
  /** How many tiles from `earliest`. */
  days: number;
  /** The tiles that can be marked; the others are closed days. */
  orderableDates: IsoDate[];
  closedWeekdays: Weekday[];
  cutoffTime: TimeOfDay;
  /** Today's cutoff has passed, so tomorrow can no longer be ordered. */
  pastTodaysCutoff: boolean;
}

/** GET /api/admin/branches/{branchId}/availability (A4). */
export interface BranchAvailability {
  branch: AvailabilityBranchOption;
  /** Every branch for the owner; the staff member's own for staff. */
  branches: AvailabilityBranchOption[];
  calendar: AvailabilityCalendar;
  /** Active products only, in menu category order. */
  categories: AvailabilityCategory[];
  /** Products hidden from every menu (owner only; null for staff). */
  hiddenCount: number | null;
}

/** Orders that already include the product for the day (or days) just changed. */
export interface AffectedOrders {
  count: number;
  /** The first few, earliest pickup first, e.g. ["MS-1042", "MS-1044"]. */
  orderNumbers: string[];
}

/** POST /api/admin/branches/{branchId}/availability/actions */
export interface AvailabilityActionResult {
  productId: ProductId;
  state: AvailabilityState;
  /** Null when there was nothing to check (switching on, back on sale) or the check failed. */
  affectedOrders: AffectedOrders | null;
  /** True when the orders check failed: the change still went through. */
  affectedOrdersUnknown: boolean;
}
