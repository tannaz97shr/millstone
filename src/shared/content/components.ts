import type {
  PaymentStatus,
  RecurringDisplayStatus,
  VisibleOrderStatus,
} from "@/shared/domain";

// Words built into the shared components. Screens pass their own copy as props;
// only the defaults and screen-reader labels live here.

export const componentsContent = {
  orderStatus: {
    placed: "Placed",
    ready: "Ready",
    collected: "Collected",
    cancelled: "Cancelled",
  } satisfies Record<VisibleOrderStatus, string>,
  paymentStatus: {
    unpaid: "Unpaid",
    paid: "Paid",
    refunded: "Refunded",
  } satisfies Record<PaymentStatus, string>,
  recurringStatus: {
    active: "Active",
    paused: "Paused",
    ended: "Ended",
  } satisfies Record<RecurringDisplayStatus, string>,
  recurringLabel: "Recurring",
  field: {
    optional: "(optional)",
  },
  quantityStepper: {
    group: (name?: string) => (name ? `Quantity, ${name}` : "Quantity"),
    more: (name?: string) => (name ? `One more ${name}` : "One more"),
    fewer: (name?: string) => (name ? `One fewer ${name}` : "One fewer"),
    remove: (name?: string) => (name ? `Remove ${name}` : "Remove"),
  },
  toggle: {
    on: "On",
    off: "Off",
  },
  notice: {
    dismiss: "OK",
    // Starts with the visible word so voice control users can say "OK".
    dismissLabel: "OK, dismiss message",
  },
} as const;
