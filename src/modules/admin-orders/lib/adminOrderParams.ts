import { z } from "zod";
import type { OrderId } from "@/shared/domain";

/**
 * Any order doc ID: a checkout key (UUID), a generated `{recurringOrderId}_{date}`
 * or a seeded ID. Firestore IDs can't contain "/".
 */
export const adminOrderIdParam = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,128}$/)
  .transform((value) => value as OrderId);

export const adminOrderRouteParamsSchema = z.object({ orderId: adminOrderIdParam });
