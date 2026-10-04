import { listNames } from "@/shared/utils/listNames";

// A4 branch availability. From design/admin/Availability.dc.html unless
// marked "undesigned" (listed in specs/known-issues.md).

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const products = (count: number) => plural(count, "product", "products");

/** "MS-1042, MS-1044 and MS-1045", or "MS-1042, … MS-1046 and 3 more" past the named few. */
function orderList(orderNumbers: readonly string[], count: number): string {
  const more = count - orderNumbers.length;
  return more > 0 ? `${orderNumbers.join(", ")} and ${more} more` : listNames(orderNumbers);
}

export const availabilityContent = {
  /** While the page loads (the branch isn't known yet). */
  pageTitle: "Availability",
  title: (branch: string) => `What’s on at ${branch}`,
  intro: "Switch a product off if this branch doesn’t make it. Mark it sold out when it’s gone for a day.",
  regionLabel: "Branch and date",
  branchLabel: "Branch",
  /** Undesigned: the status line while another branch loads. */
  loadingBranch: (branch: string) => `Loading ${branch}…`,
  picker: {
    label: "Mark sold out for",
    /** Before the cutoff, with tomorrow the earliest (as designed). */
    earliestTomorrow: (day: string, cutoff: string) =>
      `Earliest pickup is ${day}, because orders close at ${cutoff} today.`,
    /** Undesigned: after the cutoff. */
    earliestAfterCutoff: (day: string, cutoff: string) =>
      `Earliest pickup is ${day}, because orders closed at ${cutoff} today.`,
    /** Undesigned: tomorrow is a closed day. */
    earliest: (day: string) => `Earliest pickup is ${day}.`,
    lasts: "Sold out lasts for that one day, then clears itself.",
  },
  summary: (counts: { products: number; on: number; off: number; soldOut: number }) =>
    [
      products(counts.products),
      `${counts.on} on the menu`,
      counts.off ? `${counts.off} off` : null,
      counts.soldOut ? `${counts.soldOut} sold out for a day` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  caption: (count: number, off: number) => (off ? `${products(count)} · ${off} off the menu` : products(count)),
  row: {
    onText: "On the menu",
    offText: "Off the menu",
    soldOutTag: (day: string) => `Sold out ${day}`,
    backOnSale: "Back on sale",
    backOnSaleLabel: (name: string, day: string) => `Put ${name} back on sale for ${day}`,
    markSoldOut: (day: string) => `Sold out for ${day}`,
    markSoldOutLabel: (name: string, day: string) => `Mark ${name} sold out for ${day}`,
    offNote: (branch: string) => `Customers at ${branch} won’t see it.`,
  },
  hiddenNote: (count: number) =>
    count === 1
      ? "1 product is hidden from every menu, so it isn’t listed here."
      : `${count} products are hidden from every menu, so they aren’t listed here.`,
  manageProducts: "Manage products",
  messages: {
    switchedOn: (name: string, branch: string) => `${name} is back on the menu at ${branch}.`,
    switchedOff: (name: string, branch: string) =>
      `${name} is off the menu at ${branch}. Recurring orders will leave it out and say why.`,
    soldOut: (name: string, day: string) =>
      `${name} is sold out for ${day}. Customers can’t order it for that day, and recurring orders will leave it out.`,
    backOnSale: (name: string, day: string | null) =>
      day ? `${name} is back on sale for ${day}.` : `${name} is back on sale.`,
    /** Undesigned: orders already placed for that day keep the product. */
    affectedOnDay: (count: number, orderNumbers: readonly string[], day: string) =>
      `${count === 1 ? "1 order" : `${count} orders`} for ${day} already ${count === 1 ? "has" : "have"} it: ${orderList(orderNumbers, count)}. ${count === 1 ? "That order stays" : "Those orders stay"} as placed, so call the ${count === 1 ? "customer" : "customers"} if you can’t make it.`,
    /** Undesigned: switching off, any day from today on. */
    affectedUpcoming: (count: number, orderNumbers: readonly string[]) =>
      `${count === 1 ? "1 order still to collect already has" : `${count} orders still to collect already have`} it: ${orderList(orderNumbers, count)}. ${count === 1 ? "That order stays" : "Those orders stay"} as placed, so call the ${count === 1 ? "customer" : "customers"} if you can’t make it.`,
    /** Undesigned: the change went through, but the orders check didn't. */
    affectedUnknown: "We couldn’t check for orders that already have it. Look on Orders before the day.",
    /** Undesigned. */
    changed: (name: string, now: string) =>
      `${name} was already changed on another screen. It’s now ${now}. The list is up to date.`,
    gone: (name: string) => `${name} was hidden on another screen, so it’s no longer on this list.`,
    dayClosed: (day: string, earliest: string) =>
      `Orders for ${day} have closed, so nothing can be marked sold out for it. The earliest is now ${earliest}.`,
    unavailable: "The menu didn’t answer in time. Try again in a moment.",
    failed: "That didn’t go through. Check the connection and try again.",
  },
  stateWords: {
    on: "on the menu",
    off: "off the menu",
    soldOut: (day: string) => `sold out for ${day}`,
  },
  load: {
    loading: "Loading the menu…",
    failed: "We couldn’t load this branch’s menu. Check the connection and try again.",
    /** Undesigned: the owner chose another branch and it didn't load. */
    failedBranch: (branch: string) => `${branch} didn’t load.`,
    retry: "Try again",
    empty: "There are no products on the menus yet.",
  },
} as const;
