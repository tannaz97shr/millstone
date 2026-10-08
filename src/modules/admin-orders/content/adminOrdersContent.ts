import type { CancellationReason, VisibleOrderStatus } from "@/shared/domain";
import type { StatusFilter } from "../lib/orderFilters";

// A2 order list and A3 order detail. From design/admin/Main.dc.html unless
// marked "undesigned" (listed in specs/known-issues.md).

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const orders = (count: number) => plural(count, "order", "orders");

const statusWords: Record<StatusFilter, string> = {
  todo: "to do",
  placed: "placed",
  ready: "ready",
  collected: "collected",
  cancelled: "cancelled",
};

export const adminOrdersContent = {
  pageTitle: "Orders",
  filters: {
    regionLabel: "Find orders",
    searchLabel: "Find an order",
    searchPlaceholder: "Order number, name or phone",
    clearSearch: "Clear search",
    searching: "Searching every date and status, including collected and cancelled orders.",
    dateLabel: "Pickup date",
    dates: { all: "All dates", today: "Today", tomorrow: "Tomorrow", custom: "Choose date" },
    pickerLabel: "Show orders for",
    closePicker: "Close",
    closedNote: (closedDays: string) => `Closed ${closedDays}.`,
    statusLabel: "Show",
    statuses: {
      todo: "To do",
      placed: "Placed",
      ready: "Ready",
      collected: "Collected",
      cancelled: "Cancelled",
    } satisfies Record<StatusFilter, string>,
    withCount: (label: string, count: number) => `${label} · ${count}`,
    branchLabel: "Branch",
    allBranches: "All branches",
  },
  status: {
    /** "6 orders to do for today at Fitzroy". */
    summary: (count: number, status: StatusFilter, where: string, branch: string | null) =>
      `${orders(count)} ${statusWords[status]}${where}${branch ? ` at ${branch}` : ""}`,
    found: (count: number, query: string) => `${orders(count)} found for “${query}”`,
    /** Undesigned: a search is loading; the previous rows are dimmed and can't be used. */
    searching: "Searching…",
    whereToday: " for today",
    whereTomorrow: " for tomorrow",
    whereDate: (day: string) => ` for ${day}`,
    /** Undesigned: Collected/Cancelled on All dates only reach back two weeks. */
    whereRecent: " in the last 2 weeks",
    /** Undesigned: a search that hit its limit. */
    capped: "Showing the latest 100. Add more of the name or number to narrow it down.",
    updated: (time: string) => `Updated ${time}. New orders appear here by themselves.`,
    /** Undesigned: the refresh failed; the list shown is from the last good one. */
    refreshFailed: (time: string) => `Couldn't refresh since ${time}. Trying again by itself.`,
    arrivedOne: (number: string) => `${number} just came in`,
    arrivedMany: (numbers: string[]) =>
      numbers.length <= 3 ? `${numbers.join(", ")} just came in` : `${numbers.length} new orders just came in`,
  },
  messages: {
    collected: (number: string) => `${number} collected`,
    undo: "Undo",
    undoLabel: (number: string, previous: string) => `Undo: put ${number} back to ${previous}`,
    ready: (number: string) => `${number} is ready.`,
    backIn: (number: string, previous: string) => `${number} is back in ${previous}.`,
    paidAndCollected: (number: string) => `${number} paid and collected.`,
    cancelled: (number: string, refundDue: boolean) =>
      `${number} cancelled.${refundDue ? " Refund it in the payment dashboard." : ""}`,
    refunded: (number: string) => `${number} marked refunded.`,
    // Undesigned: the order changed elsewhere, the Undo came too late, or the request failed.
    changed: (number: string, status: string) =>
      `${number} was already changed on another screen. It's now ${status}. The list is up to date.`,
    undoExpired: (number: string) => `Too late to undo. ${number} stays collected.`,
    failed: "That didn't go through. Check the connection and try again.",
    unavailable: "The orders didn't answer in time. Try again in a moment.",
  },
  groups: {
    today: (day: string) => `Today · ${day}`,
    tomorrow: (day: string) => `Tomorrow · ${day}`,
    caption: (count: number, ready: number | null) => `${orders(count)}${ready === null ? "" : ` · ${ready} ready`}`,
    branchCaption: (count: number) => `· ${orders(count)}`,
  },
  empty: {
    searchTitle: (query: string) => `No orders match “${query}”.`,
    searchHint: "Check the order number, or try the last few digits of their phone number.",
    dateTitle: (where: string) => `No orders${where}.`,
    dateHint: "Orders for this date will show up here by themselves as customers place them.",
    showAllDates: "Show all dates",
    statusTitle: (status: StatusFilter) => `Nothing ${statusWords[status]} right now.`,
    statusHint: "New orders will show up here by themselves.",
  },
  load: {
    // Undesigned.
    loading: "Loading orders…",
    failed: "We couldn't load the orders. Check the connection and try again.",
    retry: "Try again",
  },
  panel: {
    close: "Close",
    pickup: (day: string, branch: string) => `Pickup ${day} · ${branch}`,
    generationHint: "Left out when this recurring order was made. Call the customer if they need it from somewhere else.",
    refundTitle: (total: string) => `Refund ${total} in the payment dashboard`,
    refundBody:
      "This order was paid online. Cancelling it here doesn't send the money back. Refund it in the payment provider's dashboard first, then tap Mark refunded.",
    markRefunded: "Mark refunded",
    customer: "Customer",
    notes: "Customer notes",
    items: "Items",
    itemColumn: "Item",
    eachColumn: "Each",
    totalColumn: "Total",
    total: "Total",
    quantity: (quantity: number) => `${quantity} ×`,
    noItems: "No items — every item was unavailable. Call the customer.",
    payment: "Payment",
    methodOnline: "Paid online",
    methodAtPickup: "Pay at pickup",
    paidLine: (when: string, ref: string | null) => `Paid ${when}${ref ? ` · Ref ${ref}` : ""}`,
    refundedLine: (when: string, ref: string | null) => `Refunded ${when}${ref ? ` · Ref ${ref}` : ""}`,
    unpaidLine: (total: string) => `Not paid yet. Take ${total} when they collect.`,
    nothingPaid: "Nothing was paid.",
    // Undesigned: the provider's own page for a paid online order (step 10).
    seeInStripe: "See this payment in Stripe",
    newTab: " (opens in a new tab)",
    reason: "Why it was cancelled",
    history: "History",
    historyLabels: {
      placed: "Placed",
      paid: "Paid",
      ready: "Ready",
      collected: "Collected",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },
    ready: "Ready",
    collected: "Collected",
    cancelOrder: "Cancel order",
    lockedCollected: "Collected orders are finished and can’t be changed. If something was wrong, make a new order.",
    lockedCancelled:
      "Cancelled orders are finished and can’t be reopened. If the customer still wants it, make a new order.",
    // Undesigned.
    loading: "Loading the order…",
    failed: "We couldn't load this order.",
    notFound: "This order isn't on your list. It may be at another branch.",
  },
  reasons: {
    not_collected: { label: "Not collected", hint: "The customer didn’t come in for it." },
    customer_request: { label: "Customer request", hint: "They called or came in to cancel." },
    other: { label: "Other", hint: "Anything else. You’ll be asked what happened." },
  } satisfies Record<CancellationReason, { label: string; hint: string }>,
  cancelDialog: {
    title: (number: string) => `Cancel ${number}?`,
    summary: (name: string, total: string, pickup: string) =>
      `${name} · ${total} · pickup ${pickup}. A cancelled order can't be reopened.`,
    reasonLabel: "Why is it being cancelled?",
    noteLabel: "What happened?",
    noteHint: "A few words for whoever looks at this order next.",
    refundTitle: "Paid online: remember the refund",
    refundBody: (total: string) =>
      `Cancelling doesn't send the ${total} back. Refund it in the payment provider's dashboard, then tap Mark refunded on this order.`,
    confirm: "Cancel order",
    chooseReason: "Choose a reason first",
    sayWhat: "Say what happened first",
    keep: "Keep order",
    // Undesigned: errors under the fields after an attempt.
    reasonError: "Choose why it's being cancelled.",
    noteError: "Say in a few words what happened.",
    noteTooLong: (max: number) => `Keep it under ${max} characters.`,
  },
  confirmPayment: {
    title: (name: string) => `Has ${name} paid?`,
    body: "They chose to pay at pickup. Take",
    bodyEnd: "before you hand the order over.",
    yes: "Yes, paid · Collected",
    notYet: "Not yet",
  },
  statusWord: {
    placed: "Placed",
    ready: "Ready",
    collected: "Collected",
    cancelled: "Cancelled",
  } satisfies Record<VisibleOrderStatus, string>,
} as const;
