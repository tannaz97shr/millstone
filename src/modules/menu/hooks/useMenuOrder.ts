"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { cartContent } from "@/modules/cart/content/cartContent";
import { dismissCartProblem, updateCart, useCart } from "@/modules/cart/hooks/useCart";
import {
  clearCartMessages,
  pushCartMessage,
  useCartMessages,
} from "@/modules/cart/hooks/useCartMessages";
import {
  moveCart,
  reconcileCart,
  resolvePickupDate,
  setQuantity,
} from "@/modules/cart/lib/cartLogic";
import type { CartRemovals } from "@/modules/cart/types/cart";
import type { BranchId, IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { formatPickupDay, isIsoDate } from "@/shared/utils/pickup-dates";
import type { MenuProduct } from "../types/menu";
import { useBranchMenuQuery } from "./useBranchMenuQuery";

/** Swaps the URL's ?date without a navigation; Next keeps useSearchParams in step. */
function replaceMenuUrl(branchId: BranchId, date: IsoDate) {
  window.history.replaceState(null, "", routes.menu(branchId, date));
}

/**
 * C2's state: which pickup date the menu is for, the cart, and the messages
 * about what changed.
 *
 * The URL says which branch and date; the cart follows it. The date is the
 * URL's, else the cart's, else the earliest. One the server's calendar can't
 * take moves to the earliest, with a message. Once the menu for that branch
 * and date has loaded, the cart is checked against it: items the branch
 * doesn't make or that are sold out that day come out, named (AC-C2, AC-C3).
 *
 * The effects only write to the cart and message stores (outside React);
 * the screen re-renders from those.
 */
export function useMenuOrder(branchId: BranchId, branch: BranchSummary | undefined) {
  const searchParams = useSearchParams();
  const rawDate = searchParams.get("date");
  const urlDate = rawDate && isIsoDate(rawDate) ? rawDate : null;

  const cartState = useCart();
  const cartReady = cartState.status === "ready";
  const cart = cartReady ? cartState.cart : null;
  const messages = useCartMessages(branchId);

  // Until the browser has read the cart, resolve as the server did (no cart),
  // so the first render matches the prefetched menu.
  const resolved = branch
    ? resolvePickupDate(urlDate, cart?.pickupDate ?? null, branch.pickup)
    : null;
  const date = resolved?.date ?? null;
  const movedFrom = resolved?.movedFrom ?? null;

  // Point the URL and the cart at the resolved branch and date.
  useEffect(() => {
    if (!cartReady || !date) return;
    if (date !== urlDate) replaceMenuUrl(branchId, date);
    updateCart((current) => moveCart(current, { branchId, pickupDate: date }));
    if (movedFrom) {
      pushCartMessage(branchId, cartContent.dateMoved(formatPickupDay(movedFrom), formatPickupDay(date)));
    }
  }, [cartReady, branchId, date, urlDate, movedFrom]);

  const menuQuery = useBranchMenuQuery(branchId, date);
  const menu = menuQuery.data;
  /** The menu on screen is for the chosen date (not the previous one, still showing). */
  const menuIsCurrent = Boolean(menu) && !menuQuery.isPlaceholderData && menu?.date === date;

  // Check the cart against the menu for its branch and date.
  const cartBranchId = cart?.branchId;
  const cartDate = cart?.pickupDate;
  useEffect(() => {
    if (!cartReady || !branch || !menu || !menuIsCurrent) return;
    const outcome: { removed: CartRemovals | null } = { removed: null };
    updateCart((current) => {
      if (!current) return current;
      const result = reconcileCart(current, menu);
      outcome.removed = result.removed;
      return result.cart;
    });
    if (!outcome.removed) return;
    const { notMadeHere, soldOut, noLongerOffered } = outcome.removed;
    const say = (message: string) => pushCartMessage(branch.id, message);
    if (notMadeHere.length) say(cartContent.removed.notMadeHere(notMadeHere, branch.name));
    if (soldOut.length) say(cartContent.removed.soldOut(soldOut, formatPickupDay(menu.date)));
    if (noLongerOffered.length) say(cartContent.removed.noLongerOffered(noLongerOffered, branch.name));
  }, [cartReady, branch, menu, menuIsCurrent, cartBranchId, cartDate]);

  const pickDate = useCallback(
    (next: IsoDate) => {
      clearCartMessages();
      replaceMenuUrl(branchId, next);
      updateCart((current) => moveCart(current, { branchId, pickupDate: next }));
    },
    [branchId],
  );

  const changeQuantity = useCallback(
    (product: MenuProduct, quantity: number) => {
      if (!date) return;
      updateCart((current) =>
        setQuantity(moveCart(current, { branchId, pickupDate: date }), product, quantity),
      );
    },
    [branchId, date],
  );

  return {
    date,
    cart,
    storageProblem: cartReady ? cartState.problem : null,
    dismissStorageProblem: dismissCartProblem,
    menuQuery,
    menuIsCurrent,
    messages,
    dismissMessages: clearCartMessages,
    pickDate,
    changeQuantity,
  };
}
