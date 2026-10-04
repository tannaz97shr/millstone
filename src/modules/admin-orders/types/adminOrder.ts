import type {
  BranchId,
  CancellationReason,
  Cents,
  IsoDate,
  IsoInstant,
  OrderId,
  PaymentMethod,
  PaymentStatus,
  VisibleOrderStatus,
  Weekday,
} from "@/shared/domain";
import type { StatusFilter } from "../lib/orderFilters";

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
  cancellationReason: CancellationReason | null;
  /** Staff's words, with the reason "other". */
  cancellationNote: string | null;
  paidAt: IsoInstant | null;
  readyAt: IsoInstant | null;
  collectedAt: IsoInstant | null;
  cancelledAt: IsoInstant | null;
  refundedAt: IsoInstant | null;
}

/** A branch the list can show, in the order its headings and filter buttons go. */
export interface AdminBranchOption {
  id: BranchId;
  name: string;
  closedDays: Weekday[];
}

/** GET /api/admin/orders. */
export interface AdminOrderList {
  orders: AdminOrderRow[];
  /** Orders per status for the current date and branch; null while searching. */
  counts: Record<StatusFilter, number> | null;
  /** Melbourne dates, from the server's clock. */
  today: IsoDate;
  tomorrow: IsoDate;
  /** The staff member's own branch, or every branch for the owner, in display order. */
  branches: AdminBranchOption[];
  /** Collected or cancelled on "All dates" only go back to here. */
  finalSince: IsoDate | null;
  /** True when a search hit its limit; only the latest are shown. */
  capped: boolean;
  generatedAt: IsoInstant;
}

/** POST /api/admin/orders/{id}/actions. */
export interface AdminOrderActionResult {
  order: AdminOrderDetail;
  /** After a one-tap Collected: when the server stops accepting Undo. */
  undoUntil: IsoInstant | null;
}
