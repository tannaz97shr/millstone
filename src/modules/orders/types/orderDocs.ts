import type { z } from "zod";
import type { orderCounterDocSchema, orderDocSchema, orderItemDocSchema } from "../lib/orderSchema";

export type OrderDoc = z.input<typeof orderDocSchema>;
export type OrderItemDoc = z.input<typeof orderItemDocSchema>;
export type OrderCounterDoc = z.input<typeof orderCounterDocSchema>;
