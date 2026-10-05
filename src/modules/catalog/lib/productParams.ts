import { z } from "zod";
import type { ProductId } from "@/shared/domain";

// Product IDs are slugs ("sourdough-rye-loaf"). Shared by the admin's API
// bodies and route params.

export const PRODUCT_ID_MAX_LENGTH = 64;

export const productIdParam = z
  .string()
  .regex(new RegExp(`^[a-z0-9-]{1,${PRODUCT_ID_MAX_LENGTH}}$`), "expected a product slug")
  .transform((value) => value as ProductId);
