import type { OrderStatus, PaymentMethod, PaymentStatus } from "./enums";
import type {
  BranchId,
  Cents,
  CustomerId,
  IsoDate,
  IsoInstant,
  OrderId,
  ProductId,
  RecurringOrderId,
} from "./ids";

/** One line, snapshotted at order time so price or name changes never alter it. */
export interface OrderItem {
  productId: ProductId;
  productName: string;
  unitPriceCents: Cents;
  quantity: number;
  lineTotalCents: Cents;
}

export interface Order {
  id: OrderId;
  /** Read aloud at the counter, e.g. "MS-1042". */
  orderNumber: string;
  branchId: BranchId;
  customerId: CustomerId | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupDate: IsoDate;
  status: OrderStatus;
  notes: string;
  items: OrderItem[];
  totalCents: Cents;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  /** Webhook event IDs already applied, so a duplicate event changes nothing. */
  processedStripeEventIds: string[];
  recurringOrderId: RecurringOrderId | null;
  generationNote: string | null;
  cancellationReason: string | null;
  createdAt: IsoInstant;
  paidAt: IsoInstant | null;
  refundedAt: IsoInstant | null;
  readyAt: IsoInstant | null;
  collectedAt: IsoInstant | null;
  cancelledAt: IsoInstant | null;
}
