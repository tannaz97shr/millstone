import type {
  BranchId,
  Cents,
  IsoDate,
  IsoInstant,
  OrderId,
  PaymentMethod,
  PaymentStatus,
  VisibleOrderStatus,
} from "@/shared/domain";

/** One order as the A2 list shows it (AC-A2). */
export interface AdminOrderRow {
  id: OrderId;
  orderNumber: string;
  branchId: BranchId;
  branchName: string;
  pickupDate: IsoDate;
  status: VisibleOrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** The label to show: null on a cancelled pay-at-pickup order (nothing was paid). */
  paymentLabel: PaymentStatus | null;
  contactName: string;
  /** Digits only; formatted for display. */
  contactPhone: string;
  items: { name: string; quantity: number }[];
  totalCents: Cents;
  recurring: boolean;
  /** Customer notes; null when empty. */
  notes: string | null;
  generationNote: string | null;
  createdAt: IsoInstant;
}

export interface AdminOrderLine {
  productName: string;
  quantity: number;
  unitPriceCents: Cents;
  lineTotalCents: Cents;
}

/** Everything the A3 panel shows (AC-A5). */
export interface AdminOrderDetail extends AdminOrderRow {
  contactEmail: string;
  lines: AdminOrderLine[];
  paymentRef: string | null;
  cancellationReason: string | null;
  paidAt: IsoInstant | null;
  readyAt: IsoInstant | null;
  collectedAt: IsoInstant | null;
  cancelledAt: IsoInstant | null;
  refundedAt: IsoInstant | null;
}
