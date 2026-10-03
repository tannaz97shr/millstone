import { listNames } from "@/shared/utils/listNames";

// Cart words shared by the menu (C2) now and the cart page (C4) later.

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

  storage: {
    corrupt: "We couldn't read the order saved on this device, so we've started a new one.",
    unavailable:
      "This browser isn't letting us save your order. It'll be kept while this page is open.",
  },

  placeholder: {
    title: "Your order",
    body: "The cart is being built. This page is a placeholder.",
    back: "Back to the menu",
  },
} as const;
