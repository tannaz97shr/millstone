import { z } from "zod";
import type { OrderId } from "@/shared/domain";

/** A checkout order's ID is the browser's v4 UUID checkout key. */
export const orderIdParam = z.uuid({ version: "v4" }).transform((value) => value as OrderId);

export const orderRouteParamsSchema = z.object({ orderId: orderIdParam });
