import { z } from "zod";
import type { BranchId, IsoDate } from "@/shared/domain";
import { isIsoDate } from "@/shared/utils/pickup-dates";
import type { Cart } from "../types/cart";
import { MAX_QUANTITY } from "./cartLogic";

// What may come back out of localStorage. Anything else is thrown away.

const isoDate = z
  .string()
  .refine(isIsoDate)
  .transform((value) => value as IsoDate);
const branchId = z
  .string()
  .min(1)
  .transform((value) => value as BranchId);

const place = z.object({ branchId, pickupDate: isoDate });

const storedCartSchema = z.object({
  version: z.literal(1),
  branchId,
  pickupDate: isoDate,
  items: z.record(
    z.string().min(1),
    z.object({
      quantity: z.number().int().min(1).max(MAX_QUANTITY),
      name: z.string(),
    }),
  ),
  checkedAgainst: place.nullable(),
});

export type ParsedCart =
  | { ok: true; cart: Cart | null }
  | { ok: false; error: unknown };

/** Parses the stored JSON. Nothing stored is a valid, missing cart. */
export function parseStoredCart(raw: string | null): ParsedCart {
  if (raw === null) return { ok: true, cart: null };
  try {
    const result = storedCartSchema.safeParse(JSON.parse(raw));
    if (!result.success) return { ok: false, error: result.error };
    const { items, ...rest } = result.data;
    // Keys are product IDs; the menu decides later whether each one still exists.
    return { ok: true, cart: { ...rest, items: items as Cart["items"] } };
  } catch (error) {
    return { ok: false, error };
  }
}
