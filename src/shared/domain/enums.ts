// Enum values as const arrays so Zod schemas and UI code share one list.

export const ORDER_STATUSES = [
  "awaiting_payment",
  "placed",
  "ready",
  "collected",
  "cancelled",
  "expired",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The statuses staff and customers ever see; awaiting_payment and expired never appear in the UI. */
export const VISIBLE_ORDER_STATUSES = ["placed", "ready", "collected", "cancelled"] as const;
export type VisibleOrderStatus = (typeof VISIBLE_ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["online", "at_pickup"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Why staff cancelled an order (AC-A8). "other" carries a note. */
export const CANCELLATION_REASONS = ["not_collected", "customer_request", "other"] as const;
export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

/** The longest note staff can give with "other". */
export const CANCELLATION_NOTE_MAX = 200;

/** Where a one-tap Collected can go back to with Undo (spec 7). */
export const UNDOABLE_STATUSES = ["placed", "ready"] as const;
export type UndoableStatus = (typeof UNDOABLE_STATUSES)[number];

export const STAFF_ROLES = ["owner", "staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const RECURRING_ORDER_STATUSES = ["active", "paused"] as const;
export type RecurringOrderStatus = (typeof RECURRING_ORDER_STATUSES)[number];

/** How a recurring order is shown. "ended" is derived once ends_on has passed; it isn't stored. */
export const RECURRING_DISPLAY_STATUSES = ["active", "paused", "ended"] as const;
export type RecurringDisplayStatus = (typeof RECURRING_DISPLAY_STATUSES)[number];
