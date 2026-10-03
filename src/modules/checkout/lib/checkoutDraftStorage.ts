import { z } from "zod";
import { logError } from "@/shared/utils/logError";
import type { CheckoutFormValues } from "./checkoutSchema";

// What's typed on C5, kept for this browser tab only (sessionStorage), so it
// survives going back to C4 and returning. Cleared once the order is placed.
// Browser only.

const KEY = "millstone:checkout:guest";

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

export function readCheckoutDraft(): CheckoutDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw === null) return null;
    const result = draftSchema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
    logError(result.error, "checkoutDraft.read: draft discarded", { level: "warn" });
  } catch (error) {
    logError(error, "checkoutDraft.read", { level: "warn" });
  }
  return null;
}

/** A storage failure only costs the draft; checkout carries on without it. */
export function writeCheckoutDraft(draft: CheckoutDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch (error) {
    logError(error, "checkoutDraft.write", { level: "warn" });
  }
}

export function clearCheckoutDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch (error) {
    logError(error, "checkoutDraft.clear", { level: "warn" });
  }
}

export const newCheckoutKey = () => crypto.randomUUID();
