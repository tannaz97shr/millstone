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
  endsOn: IsoDate | null;
  notes: string;
  items: RecurringOrderItem[];
  /** Single pickup dates the customer skipped. */
  skipDates: IsoDate[];
  createdAt: IsoInstant;
}
