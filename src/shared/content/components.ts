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
  productCard: {
    add: "Add",
    addLabel: (name: string) => `Add ${name} to order`,
    soldOut: "Sold out",
  },
  datePicker: {
    previousMonth: "Previous month",
    nextMonth: "Next month",
    unavailable: (day: string) => `${day}, not available`,
  },
  weekdayPicker: {
    closed: "Closed",
    closedLabel: (day: string, closedText: string) => `${day}, ${closedText.toLowerCase()}`,
  },
  orderRow: {
    label: (orderNumber: string) => `Order ${orderNumber}`,
    ready: "Ready",
    collected: "Collected",
    readyLabel: (orderNumber: string) => `Mark ${orderNumber} ready`,
    collectedLabel: (orderNumber: string) => `Mark ${orderNumber} collected`,
    details: "Details",
    detailsLabel: (orderNumber: string) => `Details for ${orderNumber}`,
    note: "Note:",
    item: (quantity: number, name: string) => `${quantity} × ${name}`,
    itemSeparator: ", ",
    nameAndPhone: (phone: string) => ` · ${phone}`,
  },
} as const;
