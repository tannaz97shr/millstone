import { formatCents } from "@/shared/utils/money";

// C2 Menu and C3 product detail. C2 copy from design/customer/Menu.dc.html;
// C3 wasn't designed (spec section 13), so its words are new.

export const menuContent = {
  title: "Order for pickup",

  pickup: {
    regionLabel: "Your pickup",
    from: "Pickup from",
    change: "Change",
    changeLabel: (branch: string) => `Change branch, currently ${branch}`,
    dayLabel: "Pickup day",
    closed: (days: string) => (days ? ` Closed ${days}.` : ""),
    cutoffNote: (cutoff: string, closed: string) =>
      `Order by ${cutoff} for next-day pickup.${closed}`,
    afterCutoffNote: (cutoff: string, earliest: string, closed: string) =>
      `It’s after ${cutoff}, so the earliest pickup is ${earliest}.${closed}`,
  },

  categoriesLabel: "Menu categories",
  soldOutFor: (day: string) => `Sold out for ${day}`,
  /** Not designed: a branch with nothing on its menu. */
  empty: "There's nothing on this menu yet. Call the branch and we'll help.",

  loading: "Loading the menu…",
  checking: (day: string) => `Checking what's left for ${day}…`,
  loadError: "We couldn't load the menu. Check your connection and try again.",
  retry: "Try again",

  orderBar: {
    label: "Your order",
    summary: (itemCount: string, day: string) => `${itemCount} · Pickup ${day}`,
    viewCart: "View cart",
  },

  detail: {
    soldOut: (day: string) => `Sold out for ${day}. Pick another day if you need it.`,
    quantity: "How many?",
    add: (totalCents: number) => `Add to order · ${formatCents(totalCents)}`,
    update: (totalCents: number) => `Update order · ${formatCents(totalCents)}`,
    remove: "Remove from order",
    cancel: "Cancel",
    close: "Close",
  },
} as const;
