import { z } from "zod";
import { branchIdParam, pickupDateParam } from "@/modules/branches/lib/branchParams";
import { MAX_QUANTITY } from "@/modules/cart/lib/cartLogic";
import { CONTACT_LIMITS } from "@/modules/checkout/lib/checkoutSchema";
import type { ProductId, Weekday } from "@/shared/domain";
import { recurringContent } from "../content/recurringContent";

// Recurring-order rules, shared by C11's form and the /api/account/recurring-orders
// routes, so the browser and the server accept the same input (AC-R2, R4).
// The rules that need the branch or the clock (closed days, earliest start,
// what's on the menu, cutoffs) are checked on the server only.

const errors = recurringContent.errors;

/** The most lines one recurring order can have. A cafe's standing order is far fewer. */
export const MAX_RECURRING_ITEMS = 30;

/** The most recurring orders one account can have that haven't ended (undesigned limit). */
export const MAX_LIVE_RECURRING_ORDERS = 10;

/** Past skip dates are dropped on every save; this caps the rest. */
export const MAX_SKIP_DATES = 60;

const weekdayField = z
  .number()
  .int()
  .min(0)
  .max(6)
  .transform((value) => value as Weekday);

const daysOfWeekField = z
  .array(weekdayField)
  .min(1, errors.days)
  .max(7, errors.days)
  .refine((days) => new Set(days).size === days.length, { message: errors.days });

const productIdField = z
  .string()
  .regex(/^[a-z0-9-]{1,64}$/, "expected a product slug")
  .transform((value) => value as ProductId);

const itemsField = z
  .array(z.object({ productId: productIdField, quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
  .min(1, errors.items)
  .max(MAX_RECURRING_ITEMS, errors.tooManyItems)
  .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
    message: "each product may appear once",
  });

const notesField = z.string().trim().max(CONTACT_LIMITS.notes, errors.notesTooLong);

/** What C11 saves, on create and edit. */
const recurringFieldsSchema = z.object({
  daysOfWeek: daysOfWeekField,
  items: itemsField,
  startsOn: pickupDateParam,
  /** The last pickup day, or null for no end. */
  endsOn: pickupDateParam.nullable(),
  notes: notesField,
});

const endAfterStart = <T extends { startsOn: string; endsOn: string | null }>(fields: T) =>
  fields.endsOn === null || fields.endsOn >= fields.startsOn;

/** POST /api/account/recurring-orders (C11 new). */
export const createRecurringRequestSchema = recurringFieldsSchema
  .extend({ branchId: branchIdParam })
  .refine(endAfterStart, { message: errors.endBeforeStart, path: ["endsOn"] });

/**
 * PATCH /api/account/recurring-orders/{id} (C11 edit). The branch never
 * changes (AC-R4). `startsOn` only counts until the first pickup; after
 * that the stored start stays.
 */
export const updateRecurringRequestSchema = recurringFieldsSchema
  .extend({ expectedVersion: z.number().int().nonnegative() })
  .refine(endAfterStart, { message: errors.endBeforeStart, path: ["endsOn"] });

/** POST /api/account/recurring-orders/{id}/actions (C12). */
export const recurringActionRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pause"), expectedVersion: z.number().int().nonnegative() }),
  z.object({ action: z.literal("resume"), expectedVersion: z.number().int().nonnegative() }),
  z.object({ action: z.literal("skip"), date: pickupDateParam, expectedVersion: z.number().int().nonnegative() }),
  z.object({ action: z.literal("unskip"), date: pickupDateParam, expectedVersion: z.number().int().nonnegative() }),
  z.object({ action: z.literal("end_now"), expectedVersion: z.number().int().nonnegative() }),
  z.object({ action: z.literal("end_after"), date: pickupDateParam, expectedVersion: z.number().int().nonnegative() }),
]);

export const recurringOrderIdParam = z
  .string()
  .regex(/^[A-Za-z0-9-]{1,64}$/, "expected a recurring order ID");

export const recurringRouteParamsSchema = z.object({ recurringOrderId: recurringOrderIdParam });

export type CreateRecurringRequest = z.output<typeof createRecurringRequestSchema>;
export type UpdateRecurringRequest = z.output<typeof updateRecurringRequestSchema>;
export type RecurringActionRequest = z.output<typeof recurringActionRequestSchema>;
export type RecurringFieldsInput = z.input<typeof recurringFieldsSchema>;
