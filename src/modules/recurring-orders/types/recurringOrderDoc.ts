import type { z } from "zod";
import type {
  recurringOrderDocSchema,
  recurringOrderItemDocSchema,
} from "../lib/recurringOrderSchema";

export type RecurringOrderDoc = z.input<typeof recurringOrderDocSchema>;
export type RecurringOrderItemDoc = z.input<typeof recurringOrderItemDocSchema>;
