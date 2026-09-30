import "server-only";
import { z } from "zod";
import { RECURRING_ORDER_STATUSES } from "@/shared/domain";
import { isoDateField, timestampField, weekdayField } from "@/shared/lib/firebase/fieldSchemas";

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
    createdAt: timestampField,
  })
  .refine((doc) => doc.endsOn === null || doc.endsOn >= doc.startsOn, {
    message: "end date can't be before the start date",
    path: ["endsOn"],
  });
