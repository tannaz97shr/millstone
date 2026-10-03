"use client";

import { useEffect } from "react";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import type { BranchMenu } from "@/modules/menu/types/menu";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { reconcileCart } from "../lib/cartLogic";
import { pushCartMessage } from "../lib/cartMessages";
import { updateCart } from "../lib/cartStorage";
import { removalMessages } from "../lib/removalMessages";
import type { Cart, CartRemovals } from "../types/cart";

export interface CheckCartOptions {
  cartReady: boolean;
  cart: Cart | null;
  branch: BranchSummary | undefined;
  menu: BranchMenu | undefined;
  /** The menu is for the cart's branch and date, not placeholder data. */
  menuIsCurrent: boolean;
  /** Where the messages show (cartMessageScope). */
  scope: string | null;
}

/**
 * Checks the cart against the current menu for its branch and date, whenever
 * either changes: items the branch doesn't make, sold out that day or no
 * longer offered come out, named in a message (AC-C2, AC-C3). Used by C2 and C4.
 */
export function useCheckCart({ cartReady, cart, branch, menu, menuIsCurrent, scope }: CheckCartOptions) {
  const cartBranchId = cart?.branchId;
  const cartDate = cart?.pickupDate;

  useEffect(() => {
    if (!cartReady || !branch || !menu || !menuIsCurrent || !scope) return;
    const outcome: { removed: CartRemovals | null } = { removed: null };
    updateCart((current) => {
      if (!current) return current;
      const result = reconcileCart(current, menu);
      outcome.removed = result.removed;
      return result.cart;
    });
    if (!outcome.removed) return;
    for (const message of removalMessages(outcome.removed, branch.name, formatPickupDay(menu.date))) {
      pushCartMessage(scope, message);
    }
  }, [cartReady, branch, menu, menuIsCurrent, scope, cartBranchId, cartDate]);
}
