import "server-only";
import { z } from "zod";
import { centsField } from "@/shared/lib/firebase/fieldSchemas";

/** Stored shape of products/{productId}. The doc ID is the product slug. */
export const productDocSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  priceCents: centsField.positive(),
  image: z.object({ path: z.string().min(1), url: z.url() }).nullable(),
  isActive: z.boolean(),
  /** Added in step 7; products saved before it read as 0 (no migration needed). */
  version: z.number().int().nonnegative().default(0),
});
