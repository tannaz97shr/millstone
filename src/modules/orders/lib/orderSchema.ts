import "server-only";
import { z } from "zod";
import {
  CANCELLATION_NOTE_MAX,
  CANCELLATION_REASONS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  UNDOABLE_STATUSES,
} from "@/shared/domain";
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

export const collectUndoDocSchema = z.object({
  previousStatus: z.enum(UNDOABLE_STATUSES),
  until: timestampField,
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
    // Added in step 10; orders saved before it have neither, so they read as null.
    checkoutSessionId: z.string().min(1).nullable().default(null),
    paymentExpiresAt: timestampField.nullable().default(null),
    recurringOrderId: z.string().min(1).nullable(),
    generationNote: z.string().min(1).nullable(),
    cancellationReason: z.enum(CANCELLATION_REASONS).nullable(),
    cancellationNote: z.string().min(1).max(CANCELLATION_NOTE_MAX).nullable(),
    collectUndo: collectUndoDocSchema.nullable(),
    // Derived from number, name and phone in orderToDoc; never read back.
    searchTokens: z.array(z.string().min(1)),
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
  )
  .refine((order) => (order.cancellationNote !== null) === (order.cancellationReason === "other"), {
    message: "a note goes with the reason \"other\", and only with it",
    path: ["cancellationNote"],
  });

/** counters/orders: the next number to hand out. */
export const orderCounterDocSchema = z.object({
  next: z.number().int().positive(),
});
