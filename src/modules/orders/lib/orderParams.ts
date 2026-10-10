import { z } from "zod";
import type { OrderId } from "@/shared/domain";

/** A checkout order's ID is the browser's v4 UUID checkout key. */
export const orderIdParam = z.uuid({ version: "v4" }).transform((value) => value as OrderId);

export const orderRouteParamsSchema = z.object({ orderId: orderIdParam });

/**
 * Any order doc ID: a checkout key (UUID), a generated `{recurringOrderId}_{date}`
 * or a seeded ID. Firestore IDs can't contain "/".
 */
export const anyOrderIdParam = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,128}$/)
  .transform((value) => value as OrderId);

export const anyOrderRouteParamsSchema = z.object({ orderId: anyOrderIdParam });
