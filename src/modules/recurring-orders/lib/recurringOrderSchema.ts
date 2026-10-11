import "server-only";
import { z } from "zod";
import { RECURRING_ORDER_STATUSES } from "@/shared/domain";
import { isoDateField, timestampField, weekdayField } from "@/shared/lib/firebase/fieldSchemas";
import { addDays } from "@/shared/utils/pickup-dates";

export const recurringOrderItemDocSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

/** Stored shape of recurringOrders/{recurringOrderId}. Items and skips are embedded. */
export const recurringOrderDocSchema = z
  .object({
    customerId: z.string().min(1),
    branchId: z.string().min(1),
    daysOfWeek: z.array(weekdayField).min(1),
    status: z.enum(RECURRING_ORDER_STATUSES),
    startsOn: isoDateField,
    endsOn: isoDateField.nullable(),
    notes: z.string(),
    items: z.array(recurringOrderItemDocSchema).min(1),
    skipDates: z.array(isoDateField),
    // Added in step 12; the seed's earlier doc has none of them.
    generatedThrough: isoDateField.nullable().default(null),
    version: z.number().int().nonnegative().default(0),
    createdAt: timestampField,
    updatedAt: timestampField.nullable().default(null),
  })
  // The day before the start means "stopped before its first pickup".
  .refine((doc) => doc.endsOn === null || doc.endsOn >= addDays(doc.startsOn, -1), {
    message: "end date can't be more than a day before the start date",
    path: ["endsOn"],
  });
