import { listNames } from "@/shared/utils/listNames";

// Cart words shared by the menu (C2) and the cart page (C4).

const itOrThem = (names: readonly string[]) => (names.length > 1 ? "them" : "it");

export const cartContent = {
  itemCount: (count: number) => (count === 1 ? "1 item" : `${count} items`),

  removed: {
    /** AC-C2, from design/customer/MenuBranchChanged.dc.html. */
    notMadeHere: (names: readonly string[], branch: string) =>
      `We took ${listNames(names)} out of your order because ${branch} doesn't make ${itOrThem(names)}.`,
    /** AC-C3, from design/customer/DateChanged.dc.html. */
    soldOut: (names: readonly string[], day: string) =>
      `${listNames(names)} ${names.length > 1 ? "are" : "is"} sold out for ${day}, so we took ${itOrThem(names)} out of your order. Pick another day if you need ${itOrThem(names)}.`,
    /** Not designed: a product switched off or retired since it was added. */
    noLongerOffered: (names: readonly string[], branch: string) =>
      `We took ${listNames(names)} out of your order because ${itOrThem(names) === "it" ? "it's" : "they're"} no longer on the ${branch} menu.`,
  },

  /** Not designed: the stored pickup day's cutoff passed (or an old link). */
  dateMoved: (from: string, to: string) =>
    `Orders for ${from} have closed, so your pickup is now ${to}.`,
  /** Not designed: C4's new branch is closed on the cart's day. */
  dateMovedClosed: (branch: string, from: string, to: string) =>
    `${branch} is closed on ${from}, so your pickup is now ${to}.`,

  storage: {
    corrupt: "We couldn't read the order saved on this device, so we've started a new one.",
    unavailable:
      "This browser isn't letting us save your order. It'll be kept while this page is open.",
  },

  // C4, from design/customer/Cart.dc.html and its CartBranch*/CartEmpty states.
  page: {
    back: "Menu",
    title: "Your order",
    loading: "Loading your order…",
    checking: (day: string) => `Checking prices for ${day}…`,
    loadError: "We couldn't load your order's prices. Check your connection and try again.",
    retry: "Try again",
  },

  pickup: {
    regionLabel: "Pickup",
    from: "Pickup from",
    day: "Pickup day",
    change: "Change",
    changeBranchLabel: (branch: string) => `Change branch, currently ${branch}`,
    changeDayLabel: "Change pickup day on the menu",
  },

  lines: {
    regionLabel: "Items",
    each: (price: string) => `${price} each`,
    addMore: "Add more items",
  },

  bar: {
    label: "Order total",
    total: "Total",
    count: (itemCount: string) => ` · ${itemCount}`,
    checkout: "Go to checkout",
  },

  empty: {
    title: "Your order is empty",
    body: (branch: string, day: string) => `Add something from the ${branch} menu to pick up on ${day}.`,
    back: "Back to the menu",
    /** Not designed: no cart at all, or its branch no longer exists. */
    noBranchBody: "Choose a branch to start an order.",
    noBranchBack: "See our branches",
  },

  changeBranch: {
    title: "Pick up from",
    question: "Which branch?",
    note: "Prices are the same at every branch. Some items are only made at one branch.",
    keep: (branch: string) => `Keep ${branch}`,
    pickUpFrom: (branch: string) => `Pick up from ${branch}`,
    /** Not designed: the new branch's menu is loading or failed. */
    checking: (branch: string) => `Checking ${branch}…`,
    loadError: (branch: string) =>
      `We couldn't check the ${branch} menu. Check your connection and try again.`,
    cancel: "Cancel",
  },

  warning: {
    title: (branch: string) => `Change to ${branch}?`,
    notMadeHere: (branch: string, count: number) =>
      `${branch} doesn't make ${count > 1 ? "these" : "this"}, so we'll take ${count > 1 ? "them" : "it"} out of your order:`,
    /** Not designed: items the new branch has sold out on the pickup day. */
    soldOut: (branch: string, day: string, count: number, alsoNotMade: boolean) =>
      `${count > 1 ? "These are" : "This is"} sold out at ${branch} for ${day}, so we'll take ${count > 1 ? "them" : "it"} out${alsoNotMade ? " too" : " of your order"}:`,
    line: (quantity: number, name: string) => `${quantity} × ${name}`,
    confirm: (branch: string) => `Change to ${branch}`,
    keep: (branch: string) => `Keep ${branch}`,
  },
} as const;
