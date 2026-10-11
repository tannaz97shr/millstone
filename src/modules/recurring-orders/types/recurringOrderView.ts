import type {
  BranchId,
  Cents,
  IsoDate,
  ProductId,
  RecurringDisplayStatus,
  RecurringOrderId,
  TimeOfDay,
  Weekday,
} from "@/shared/domain";
import type { UpcomingPickup } from "@/shared/utils/pickup-dates";

// What the /api/account/recurring-orders routes send to C9 to C12. Dates
// and rules are worked out on the server's clock; the browser only shows them.

export interface RecurringItemView {
  productId: ProductId;
  /** The product's name now (the ID if it no longer exists). */
  name: string;
  quantity: number;
  /** On the branch's menu now. Items that left it stay, and generation leaves them out with a note (AC-P2). */
  onMenu: boolean;
  /** Today's price ("$X each today", AC-R2), or null when it's no longer on the menu. */
  priceCents: Cents | null;
}

export interface RecurringBranchView {
  id: BranchId;
  name: string;
  address: string;
  /** Digits only. */
  phone: string;
  orderCutoffTime: TimeOfDay;
  closedDays: Weekday[];
}

/** One row of C10, and what C9's summary needs. */
export interface RecurringOrderSummary {
  id: RecurringOrderId;
  version: number;
  branch: RecurringBranchView;
  daysOfWeek: Weekday[];
  status: RecurringDisplayStatus;
  items: RecurringItemView[];
  startsOn: IsoDate;
  endsOn: IsoDate | null;
  /** The next pickup that will happen, or null. */
  next: UpcomingPickup | null;
}

/** C12, and C11's edit form. */
export interface RecurringOrderDetail extends RecurringOrderSummary {
  notes: string;
  /** Up to six rows from today: made, closing, skipped or open (AC-R5). */
  upcoming: UpcomingPickup[];
  /** The first date a change applies to (the day after the last locked one). */
  firstChangeable: IsoDate;
  /** The start can no longer change: its first pickup's cutoff has passed. */
  started: boolean;
  /** The earliest start the form may offer while not started (AC-R2: checkout's rule). */
  earliestStart: IsoDate;
  /** "After a pickup day" choices (AC-R7). */
  endDateOptions: IsoDate[];
  /** What "Stop now" sets as the last pickup day. */
  stopNowEndsOn: IsoDate;
  /** For "Changes apply from …" and "Your next new order is for …" (null if none within ten weeks). */
  firstNewPickup: IsoDate | null;
}

export interface RecurringOrdersResponse {
  recurringOrders: RecurringOrderSummary[];
}
