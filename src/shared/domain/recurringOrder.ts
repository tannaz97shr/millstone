import type { RecurringOrderStatus } from "./enums";
import type {
  BranchId,
  CustomerId,
  IsoDate,
  IsoInstant,
  ProductId,
  RecurringOrderId,
  Weekday,
} from "./ids";

/** No price: each generated order is priced on the day it's generated. */
export interface RecurringOrderItem {
  productId: ProductId;
  quantity: number;
}

export interface RecurringOrder {
  id: RecurringOrderId;
  customerId: CustomerId;
  branchId: BranchId;
  daysOfWeek: Weekday[];
  status: RecurringOrderStatus;
  startsOn: IsoDate;
  /**
   * The last pickup day, or null for no end. "Ended" is derived from it. It can
   * be the day before `startsOn` when the order was stopped before its first pickup.
   */
  endsOn: IsoDate | null;
  notes: string;
  items: RecurringOrderItem[];
  /** Single pickup dates the customer skipped. */
  skipDates: IsoDate[];
  /**
   * The generation cursor: the last pickup date generation has looked at for
   * this order, whether or not it made one. Dates up to it are never looked at
   * again, so a rerun makes nothing and a resume never back-fills. Null until
   * the first look.
   */
  generatedThrough: IsoDate | null;
  /** Goes up by one on every save, so a change made on another screen is refused, not overwritten. */
  version: number;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}
