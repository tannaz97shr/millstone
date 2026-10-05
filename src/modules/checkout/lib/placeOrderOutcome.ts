import type { CartRemovals } from "@/modules/cart/types/cart";
import type { Cents, IsoDate, OrderId, ProductId } from "@/shared/domain";
import type { ApiFailure } from "@/shared/lib/http/apiClient";
import type { CheckoutFormValues } from "./checkoutSchema";

// What C5 does after Place order fails, decided from the server's answer.
// Pure, so every branch is unit-tested; the hook carries it out.

export type PlaceOrderProblem =
  /**
   * The day can no longer be ordered: move the cart to `earliest` and go back
   * to C4. `closed` says the branch is now closed that day (else its cutoff passed).
   */
  | { kind: "date_moved"; earliest: IsoDate; closed: boolean }
  /** Take these out of the cart, say why on C4, and go back there. */
  | { kind: "items_removed"; productIds: ProductId[]; removed: CartRemovals }
  /** Refresh the prices and ask the customer to check the new total. */
  | { kind: "price_changed"; totalCents: Cents }
  /** This checkout already placed a different order. */
  | { kind: "key_mismatch"; orderId: OrderId; orderNumber: string }
  /** Show these fields' own error sentences. */
  | { kind: "fields"; fields: (keyof CheckoutFormValues)[] }
  /** The branch is gone: C4 asks for a branch again. */
  | { kind: "branch_gone" }
  /** Too many orders from this address for now (per-IP limit): say so, with no Try again. */
  | { kind: "rate_limited" }
  /** Anything else, including no answer: keep everything and offer Try again. */
  | { kind: "failed" };

const FORM_FIELDS: Record<string, keyof CheckoutFormValues> = {
  "contact.name": "name",
  "contact.phone": "phone",
  "contact.email": "email",
  notes: "notes",
  paymentMethod: "paymentMethod",
};

export function placeOrderProblem(failure: ApiFailure): PlaceOrderProblem {
  switch (failure.code) {
    case "closed_day":
    case "past_cutoff":
    case "out_of_range":
      return failure.earliest
        ? { kind: "date_moved", earliest: failure.earliest, closed: failure.code === "closed_day" }
        : { kind: "failed" };

    case "items_unavailable": {
      const items = failure.items ?? [];
      if (items.length === 0) return { kind: "failed" };
      const names = (reason: string) => items.filter((i) => i.reason === reason).map((i) => i.name);
      return {
        kind: "items_removed",
        productIds: items.map((item) => item.productId),
        removed: { notMadeHere: [], soldOut: names("sold_out"), noLongerOffered: names("not_available") },
      };
    }

    case "price_changed":
      return failure.totalCents === undefined
        ? { kind: "failed" }
        : { kind: "price_changed", totalCents: failure.totalCents };

    case "checkout_key_mismatch":
      return failure.existingOrder
        ? { kind: "key_mismatch", ...failure.existingOrder }
        : { kind: "failed" };

    case "invalid_body": {
      // Only fields the customer can fix; anything else (items, key) is our bug.
      const fields = (failure.fields ?? []).map((field) => FORM_FIELDS[field]);
      if (fields.length === 0 || fields.some((field) => field === undefined)) return { kind: "failed" };
      return { kind: "fields", fields: [...new Set(fields)] };
    }

    case "unknown_branch":
      return { kind: "branch_gone" };

    case "rate_limited":
      return { kind: "rate_limited" };

    default:
      return { kind: "failed" };
  }
}
