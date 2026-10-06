import type {
  CancellationReason,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UndoableStatus,
} from "./enums";
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

/**
 * Set by a one-tap Collected on a paid order: the status Undo goes back to,
 * and the last instant the server still accepts Undo (spec 7).
 */
export interface CollectUndo {
  previousStatus: UndoableStatus;
  until: IsoInstant;
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
  /** The provider's payment ID (Stripe: the PaymentIntent, `pi_…`), set when paid online. */
  paymentRef: string | null;
  /** Webhook event IDs already applied, so a duplicate event changes nothing. */
  processedStripeEventIds: string[];
  /** Online only: the provider's checkout page (Stripe: the Checkout Session, `cs_…`), once it exists. */
  checkoutSessionId: string | null;
  /** Online only: when an unpaid order stops waiting for payment (spec 6, ~1 hour). */
  paymentExpiresAt: IsoInstant | null;
  recurringOrderId: RecurringOrderId | null;
  generationNote: string | null;
  cancellationReason: CancellationReason | null;
  /** Staff's own words; set only when the reason is "other". */
  cancellationNote: string | null;
  collectUndo: CollectUndo | null;
  createdAt: IsoInstant;
  paidAt: IsoInstant | null;
  refundedAt: IsoInstant | null;
  readyAt: IsoInstant | null;
  collectedAt: IsoInstant | null;
  cancelledAt: IsoInstant | null;
}
