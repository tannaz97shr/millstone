"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { branchKeys } from "@/modules/branches/api/queryKeys";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { updateCart } from "@/modules/cart/hooks/useCart";
import { cartMessageScope, pushCartMessage } from "@/modules/cart/hooks/useCartMessages";
import { moveCart, removeItems, type CartLineView } from "@/modules/cart/lib/cartLogic";
import { cartContent } from "@/modules/cart/content/cartContent";
import { removalMessages } from "@/modules/cart/lib/removalMessages";
import { menuKeys } from "@/modules/menu/api/queryKeys";
import type { Cents, IsoDate } from "@/shared/domain";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { postOrder } from "../api/checkoutApi";
import { clearCheckoutDraft } from "../lib/checkoutDraftStorage";
import type { CheckoutFormOutput, CheckoutFormValues } from "../lib/checkoutSchema";
import { placeOrderProblem, type PlaceOrderProblem } from "../lib/placeOrderOutcome";

/** Problems C5 shows itself; the rest send the customer back to C4. */
export type CheckoutNotice = Extract<
  PlaceOrderProblem,
  { kind: "price_changed" | "key_mismatch" | "rate_limited" | "failed" }
>;

export interface PlaceOrderOptions {
  branch: BranchSummary | undefined;
  date: IsoDate | null;
  /** The lines C5 shows, priced from the live menu. */
  lines: readonly CartLineView[];
  /** The total C5 shows, sent so the server can catch a price change. */
  totalCents: Cents;
  getCheckoutKey: () => string;
  /** The server named contact fields to fix (they'd already passed in the browser). */
  onFieldErrors: (fields: (keyof CheckoutFormValues)[]) => void;
  /**
   * The order is saved. Committed before the cart is cleared, so C5 knows the
   * empty cart is a placed order and not a reason to go back to C4.
   */
  onPlaced: () => void;
}

/**
 * Place order: sends the checkout and carries out what the server says.
 * Placed: the cart and draft are cleared (AC-C9) and C7 opens. A moved day,
 * unavailable items or a missing branch change the cart, say why on C4, and
 * go there. A changed price, a reused checkout key and a failed request stay
 * on C5 as a notice, with everything as typed.
 */
export function usePlaceOrder({
  branch,
  date,
  lines,
  totalCents,
  getCheckoutKey,
  onFieldErrors,
  onPlaced,
}: PlaceOrderOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: postOrder, retry: false });
  const [notice, setNotice] = useState<CheckoutNotice | null>(null);

  const handleProblem = useCallback(
    (problem: PlaceOrderProblem) => {
      if (!branch || !date) return;
      const scope = cartMessageScope.cart(branch.id);
      switch (problem.kind) {
        case "date_moved":
          updateCart((cart) => cart && moveCart(cart, { branchId: branch.id, pickupDate: problem.earliest }));
          // The server's reason, not the cached branch: a newly closed day isn't in the cache yet.
          pushCartMessage(
            scope,
            problem.closed
              ? cartContent.dateMovedClosed(branch.name, formatPickupDay(date), formatPickupDay(problem.earliest))
              : cartContent.dateMoved(formatPickupDay(date), formatPickupDay(problem.earliest)),
          );
          void queryClient.invalidateQueries({ queryKey: branchKeys.all });
          // Stale, not refetched now: the old day's menu would only answer 422. C4 fetches the new day's.
          void queryClient.invalidateQueries({ queryKey: menuKeys.all, refetchType: "none" });
          router.push(routes.cart);
          return;
        case "items_removed":
          updateCart((cart) => cart && removeItems(cart, problem.productIds));
          for (const message of removalMessages(problem.removed, branch.name, formatPickupDay(date))) {
            pushCartMessage(scope, message);
          }
          void queryClient.invalidateQueries({ queryKey: menuKeys.all });
          router.push(routes.cart);
          return;
        case "branch_gone":
          void queryClient.invalidateQueries({ queryKey: branchKeys.all });
          router.push(routes.cart);
          return;
        case "price_changed":
          void queryClient.invalidateQueries({ queryKey: menuKeys.detail(branch.id, date) });
          setNotice(problem);
          return;
        case "fields":
          onFieldErrors(problem.fields);
          return;
        default:
          setNotice(problem);
      }
    },
    [branch, date, queryClient, router, onFieldErrors],
  );

  /** Resolves once the server has answered (or the request failed). */
  const placeOrder = useCallback(
    async (values: CheckoutFormOutput) => {
      if (!branch || !date || lines.length === 0) return;
      setNotice(null);
      let orderId: string;
      try {
        ({ orderId } = await mutation.mutateAsync({
          checkoutKey: getCheckoutKey(),
          branchId: branch.id,
          pickupDate: date,
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          contact: { name: values.name, phone: values.phone, email: values.email },
          notes: values.notes,
          paymentMethod: values.paymentMethod,
          expectedTotalCents: totalCents,
        }));
      } catch (error) {
        const failure = toApiFailure(error);
        const expected = failure.status >= 400 && failure.status < 500;
        logError(error, `usePlaceOrder: ${failure.code}`, { level: expected ? "warn" : "error" });
        handleProblem(placeOrderProblem(failure));
        return;
      }
      // Saved: only now is the cart cleared (AC-C9).
      flushSync(onPlaced);
      updateCart(() => null);
      clearCheckoutDraft();
      router.replace(routes.orderConfirmation(orderId));
    },
    [branch, date, lines, totalCents, getCheckoutKey, mutation, handleProblem, onPlaced, router],
  );

  const dismissNotice = useCallback(() => setNotice(null), []);

  return { placeOrder, pending: mutation.isPending, notice, dismissNotice };
}
