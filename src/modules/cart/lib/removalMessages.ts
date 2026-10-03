import type { Branch, IsoDate } from "@/shared/domain";
import { formatPickupDay, isClosedOn } from "@/shared/utils/pickup-dates";
import { cartContent } from "../content/cartContent";
import type { CartRemovals } from "../types/cart";

/**
 * Why the pickup day moved when the cart changed branch: the new branch is
 * closed that day (said even when its cutoff has also passed), else orders
 * for it have closed.
 */
export function branchDateMovedMessage(
  branch: Pick<Branch, "name" | "closedDays">,
  from: IsoDate,
  to: IsoDate,
): string {
  const fromDay = formatPickupDay(from);
  const toDay = formatPickupDay(to);
  return isClosedOn(branch, from)
    ? cartContent.dateMovedClosed(branch.name, fromDay, toDay)
    : cartContent.dateMoved(fromDay, toDay);
}

/**
 * The sentences that name what a cart check took out, one per reason, in a
 * fixed order: not made here, sold out, no longer offered. `day` is the
 * pickup day as shown ("Wed 30 Sep").
 */
export function removalMessages(removed: CartRemovals, branchName: string, day: string): string[] {
  const messages: string[] = [];
  if (removed.notMadeHere.length) {
    messages.push(cartContent.removed.notMadeHere(removed.notMadeHere, branchName));
  }
  if (removed.soldOut.length) messages.push(cartContent.removed.soldOut(removed.soldOut, day));
  if (removed.noLongerOffered.length) {
    messages.push(cartContent.removed.noLongerOffered(removed.noLongerOffered, branchName));
  }
  return messages;
}
