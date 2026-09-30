import "server-only";
import { z } from "zod";
import { isoDateField } from "@/shared/lib/firebase/fieldSchemas";

/**
 * Stored shape of branches/{branchId}/products/{productId}.
 * A missing doc means the product is available at that branch (the default).
 */
export const branchProductDocSchema = z.object({
  branchId: z.string().min(1),
  productId: z.string().min(1),
  isAvailable: z.boolean(),
  soldOutOn: isoDateField.nullable(),
});
