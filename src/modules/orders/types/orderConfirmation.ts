import type {
  BranchId,
  Cents,
  IsoDate,
  OrderId,
  PaymentMethod,
  PaymentStatus,
  TimeOfDay,
} from "@/shared/domain";

export interface OrderConfirmationLine {
  name: string;
  quantity: number;
  lineTotalCents: Cents;
}

/**
 * Where an order is from the customer's side. `awaiting_payment`: back from
 * the payment page, waiting for the webhook (C6). `expired`: never paid, so
 * never placed. `confirmed`: placed (C7), whatever has happened to it since.
 */
export type ConfirmationState = "awaiting_payment" | "confirmed" | "expired";

/**
 * GET /api/orders/{orderId}: only what C6, C7 and the confirmation email show.
 * The order ID in the URL is the only credential, so this leaves out the
 * phone, notes, full name and customer link.
 */
export interface OrderConfirmation {
  orderId: OrderId;
  orderNumber: string;
  state: ConfirmationState;
  pickupDate: IsoDate;
  branch: {
    id: BranchId;
    name: string;
    address: string;
    /** Digits only. */
    phone: string;
    opensAt: TimeOfDay;
  };
  lines: OrderConfirmationLine[];
  totalCents: Cents;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  contactFirstName: string;
  contactEmail: string;
}
