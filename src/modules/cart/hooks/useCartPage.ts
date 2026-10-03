"use client";

import { useCallback, useEffect } from "react";
import { useBranchesQuery } from "@/modules/branches/hooks/useBranchesQuery";
import { useBranchMenuQuery } from "@/modules/menu/hooks/useBranchMenuQuery";
import type { MenuProduct } from "@/modules/menu/types/menu";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { cartContent } from "../content/cartContent";
import { cartLines, cartSummary, moveCart, resolvePickupDate, setQuantity } from "../lib/cartLogic";
import { dismissCartProblem, updateCart, useCart } from "./useCart";
import { cartMessageScope, clearCartMessages, pushCartMessage, useCartMessages } from "./useCartMessages";
import { useCheckCart } from "./useCheckCart";

/**
 * C4's state: the stored cart, its branch and pickup day, and the latest menu
 * for them, which gives every price, name and sold-out flag. On load the same
 * checks as C2 run: a day that can't be ordered any more moves to the
 * earliest, and items the branch can't sell that day come out, named.
 */
export function useCartPage() {
  const branchesQuery = useBranchesQuery();
  const cartState = useCart();
  const cartReady = cartState.status === "ready";
  const cart = cartReady ? cartState.cart : null;

  const branches = branchesQuery.data?.branches;
  const branch = branches?.find((b) => b.id === cart?.branchId);
  const messageScope = branch ? cartMessageScope.cart(branch.id) : null;
  const messages = useCartMessages(messageScope ?? "");

  const resolved =
    branch && cart ? resolvePickupDate(null, cart.pickupDate, branch.pickup) : null;
  const date = resolved?.date ?? null;
  const movedFrom = resolved?.movedFrom ?? null;

  // A stored day whose cutoff passed (or that's closed now) moves to the earliest.
  useEffect(() => {
    if (!cartReady || !branch || !date || !movedFrom || !messageScope) return;
    updateCart((current) => current && moveCart(current, { branchId: branch.id, pickupDate: date }));
    pushCartMessage(messageScope, cartContent.dateMoved(formatPickupDay(movedFrom), formatPickupDay(date)));
  }, [cartReady, branch, date, movedFrom, messageScope]);

  const menuQuery = useBranchMenuQuery(branch?.id ?? null, date);
  const menu = menuQuery.data;
  /** The menu is for the cart's branch and day, not one still showing from before. */
  const menuIsCurrent =
    Boolean(menu) &&
    !menuQuery.isPlaceholderData &&
    menu?.branchId === branch?.id &&
    menu?.date === date &&
    date === cart?.pickupDate;

  useCheckCart({ cartReady, cart, branch, menu, menuIsCurrent, scope: messageScope });

  const changeQuantity = useCallback((product: MenuProduct, quantity: number) => {
    updateCart((current) => current && setQuantity(current, product, quantity));
  }, []);

  const retry = useCallback(() => {
    if (branchesQuery.isError) void branchesQuery.refetch();
    void menuQuery.refetch();
  }, [branchesQuery, menuQuery]);

  return {
    cartReady,
    cart,
    branches,
    branch,
    date,
    branchesQuery,
    menuQuery,
    menu,
    menuIsCurrent,
    lines: cartLines(cart, menu),
    summary: cartSummary(cart, menuIsCurrent ? menu : undefined),
    changeQuantity,
    retry,
    storageProblem: cartReady ? cartState.problem : null,
    dismissStorageProblem: dismissCartProblem,
    messages,
    dismissMessages: clearCartMessages,
  };
}
