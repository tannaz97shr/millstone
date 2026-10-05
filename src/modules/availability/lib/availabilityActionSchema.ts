import { z } from "zod";
import { pickupDateParam } from "@/modules/branches/lib/branchParams";
import { productIdParam } from "@/modules/catalog/lib/productParams";

// The body of POST /api/admin/branches/{branchId}/availability/actions
// (AC-P4, P5). Every action carries the row the staff member saw, so a change
// made on another screen in the meantime is refused, not overwritten.

const expected = z.object({
  isAvailable: z.boolean(),
  soldOutOn: pickupDateParam.nullable(),
});

export const availabilityActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("switch_on"), productId: productIdParam, expected }),
  z.object({ action: z.literal("switch_off"), productId: productIdParam, expected }),
  z.object({ action: z.literal("mark_sold_out"), productId: productIdParam, expected, date: pickupDateParam }),
  z.object({ action: z.literal("back_on_sale"), productId: productIdParam, expected }),
]);

export type AvailabilityActionRequest = z.input<typeof availabilityActionSchema>;
export type AvailabilityAction = z.output<typeof availabilityActionSchema>;
export type AvailabilityActionName = AvailabilityAction["action"];
