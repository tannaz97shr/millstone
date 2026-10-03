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
 * GET /api/orders/{orderId}: only what C7 and the confirmation email show.
 * The order ID in the URL is the only credential, so this leaves out the
 * phone, notes, full name and customer link.
 */
export interface OrderConfirmation {
  orderId: OrderId;
  orderNumber: string;
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
