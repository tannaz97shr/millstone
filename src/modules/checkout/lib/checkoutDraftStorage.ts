import { z } from "zod";
import { GUEST_CART_OWNER, getStorageOwner } from "@/modules/cart/lib/cartStorage";
import { logError } from "@/shared/utils/logError";
import type { CheckoutFormValues } from "./checkoutSchema";

// What's typed on C5, kept for this browser tab only (sessionStorage), so it
// survives going back to C4 and returning. One per owner, like the cart:
// `millstone:checkout:guest` or `millstone:checkout:{customerId}`. Cleared
// once the order is placed. Browser only.

const keyFor = (owner: string) => `millstone:checkout:${owner}`;

const draftSchema = z.object({
  version: z.literal(1),
  checkoutKey: z.uuid({ version: "v4" }),
  values: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    notes: z.string(),
    paymentMethod: z.string(),
  }),
});

export interface CheckoutDraft {
  version: 1;
  /** Sent with every Place order from this checkout, so retries can't duplicate it. */
  checkoutKey: string;
  values: CheckoutFormValues;
}

function readDraft(key: string): CheckoutDraft | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return null;
    const result = draftSchema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
    logError(result.error, "checkoutDraft.read: draft discarded", { level: "warn" });
  } catch (error) {
    logError(error, "checkoutDraft.read", { level: "warn" });
  }
  return null;
}

export function readCheckoutDraft(): CheckoutDraft | null {
  return readDraft(keyFor(getStorageOwner()));
}

/**
 * The draft typed as a guest in this tab, removed as it's read: once a
 * customer has signed in from checkout, it becomes theirs (draftAfterSignIn).
 */
export function takeGuestCheckoutDraft(): CheckoutDraft | null {
  const key = keyFor(GUEST_CART_OWNER);
  const draft = readDraft(key);
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    logError(error, "checkoutDraft.takeGuest", { level: "warn" });
  }
  return draft;
}

/** A storage failure only costs the draft; checkout carries on without it. */
export function writeCheckoutDraft(draft: CheckoutDraft): void {
  try {
    window.sessionStorage.setItem(keyFor(getStorageOwner()), JSON.stringify(draft));
  } catch (error) {
    logError(error, "checkoutDraft.write", { level: "warn" });
  }
}

export function clearCheckoutDraft(): void {
  try {
    window.sessionStorage.removeItem(keyFor(getStorageOwner()));
  } catch (error) {
    logError(error, "checkoutDraft.clear", { level: "warn" });
  }
}

export const newCheckoutKey = () => crypto.randomUUID();
