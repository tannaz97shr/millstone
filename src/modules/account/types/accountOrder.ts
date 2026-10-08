import type {
  BranchId,
  Cents,
  IsoDate,
  IsoInstant,
  OrderId,
  PaymentMethod,
  PaymentStatus,
  TimeOfDay,
  VisibleOrderStatus,
} from "@/shared/domain";

export interface AccountOrderLine {
  name: string;
  quantity: number;
  unitPriceCents: Cents;
  lineTotalCents: Cents;
}

/**
 * One of the account's own orders, for C9's cards and the account order page.
 * Only orders in the account's history (`accountId`), and never one waiting
 * for payment or expired unpaid: those were never placed.
 */
export interface AccountOrder {
  orderId: OrderId;
  orderNumber: string;
  status: VisibleOrderStatus;
  pickupDate: IsoDate;
  branch: {
    id: BranchId;
    name: string;
    address: string;
    /** Digits only. */
    phone: string;
    opensAt: TimeOfDay;
  };
  lines: AccountOrderLine[];
  totalCents: Cents;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Made by a recurring order (AC-R10). */
  recurring: boolean;
  /** What a generated order left out (AC-R9), e.g. "Rye loaf ×4 skipped: sold out". */
  generationNote: string | null;
  notes: string;
  /** The details this order was placed with (they don't follow profile edits). */
  contact: { name: string; phone: string; email: string };
  createdAt: IsoInstant;
}

/** GET /api/account/orders. `limited`: there may be older orders than these. */
export interface AccountOrdersResponse {
  orders: AccountOrder[];
  limited: boolean;
}
