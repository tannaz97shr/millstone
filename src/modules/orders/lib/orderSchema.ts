import "server-only";
import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/shared/domain";
import {
  centsField,
  emailField,
  isoDateField,
  phoneField,
  timestampField,
} from "@/shared/lib/firebase/fieldSchemas";

export const orderItemDocSchema = z
  .object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    unitPriceCents: centsField,
    quantity: z.number().int().positive(),
    lineTotalCents: centsField,
  })
  .refine((item) => item.lineTotalCents === item.unitPriceCents * item.quantity, {
    message: "line total must equal unit price × quantity",
    path: ["lineTotalCents"],
  });

/**
 * Stored shape of orders/{orderId}. Items are embedded and snapshotted.
 * Generated orders use the ID `{recurringOrderId}_{pickupDate}`.
 */
export const orderDocSchema = z
  .object({
    orderNumber: z.string().regex(/^MS-\d{4,}$/),
    branchId: z.string().min(1),
    customerId: z.string().min(1).nullable(),
    contactName: z.string().min(1),
    contactPhone: phoneField,
    contactEmail: emailField,
    pickupDate: isoDateField,
    status: z.enum(ORDER_STATUSES),
    notes: z.string(),
    // Empty is allowed: a generated order whose items were all unavailable (AC-R9).
    items: z.array(orderItemDocSchema),
    totalCents: centsField,
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentStatus: z.enum(PAYMENT_STATUSES),
    paymentRef: z.string().min(1).nullable(),
    processedStripeEventIds: z.array(z.string().min(1)),
    recurringOrderId: z.string().min(1).nullable(),
    generationNote: z.string().min(1).nullable(),
    cancellationReason: z.string().min(1).nullable(),
    createdAt: timestampField,
    paidAt: timestampField.nullable(),
    refundedAt: timestampField.nullable(),
    readyAt: timestampField.nullable(),
    collectedAt: timestampField.nullable(),
    cancelledAt: timestampField.nullable(),
  })
  .refine(
    (order) =>
      order.totalCents === order.items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    { message: "total must equal the sum of line totals", path: ["totalCents"] },
  );

/** counters/orders: the next number to hand out. */
export const orderCounterDocSchema = z.object({
  next: z.number().int().positive(),
});
