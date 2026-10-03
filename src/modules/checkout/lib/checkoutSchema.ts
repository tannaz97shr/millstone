import { z } from "zod";
import { branchIdParam, pickupDateParam } from "@/modules/branches/lib/branchParams";
import { MAX_QUANTITY } from "@/modules/cart/lib/cartLogic";
import { PAYMENT_METHODS, type ProductId } from "@/shared/domain";
import { parseAuMobile } from "@/shared/utils/phone";
import { checkoutContent } from "../content/checkoutContent";

// The checkout's rules, shared by C5's form and POST /api/orders, so the
// browser and the server accept and normalise exactly the same input.

const errors = checkoutContent.errors;

export const CONTACT_LIMITS = { name: 100, email: 254, notes: 500 } as const;

/** The most lines one order can have. The whole menu is far fewer. */
export const MAX_ORDER_LINES = 100;

export const nameField = z
  .string()
  .trim()
  .min(1, errors.name)
  .max(CONTACT_LIMITS.name, errors.nameTooLong);

/** An Australian mobile, stored as its 10 digits. */
export const mobileField = z.string().transform((value, ctx) => {
  const digits = parseAuMobile(value);
  if (digits === null) {
    ctx.addIssue({ code: "custom", message: errors.phone });
    return z.NEVER;
  }
  return digits;
});

/** Trimmed and lowercased, the form stored on customers and orders. */
export const contactEmailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(CONTACT_LIMITS.email, errors.email)
  .pipe(z.email(errors.email));

export const notesField = z.string().trim().max(CONTACT_LIMITS.notes, errors.notesTooLong);

export const paymentMethodField = z.string().pipe(z.enum(PAYMENT_METHODS, errors.paymentMethod));

/** C5's fields. Input is what was typed; output is normalised. */
export const checkoutFormSchema = z.object({
  name: nameField,
  phone: mobileField,
  email: contactEmailField,
  notes: notesField,
  paymentMethod: paymentMethodField,
});

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
export type CheckoutFormOutput = z.output<typeof checkoutFormSchema>;

const productIdField = z
  .string()
  .regex(/^[a-z0-9-]{1,64}$/, "expected a product slug")
  .transform((value) => value as ProductId);

const orderItemsField = z
  .array(
    z.object({
      productId: productIdField,
      quantity: z.number().int().min(1).max(MAX_QUANTITY),
    }),
  )
  .min(1)
  .max(MAX_ORDER_LINES)
  .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
    message: "each product may appear once",
  });

/** POST /api/orders. Never carries a price: only the total the customer was shown. */
export const placeOrderRequestSchema = z.object({
  /** Made by the browser once per checkout; becomes the order's ID, so a retry can't duplicate. */
  checkoutKey: z.uuid({ version: "v4" }),
  branchId: branchIdParam,
  pickupDate: pickupDateParam,
  items: orderItemsField,
  contact: z.object({ name: nameField, phone: mobileField, email: contactEmailField }),
  notes: notesField,
  paymentMethod: z.enum(PAYMENT_METHODS),
  /** The total C5 showed, so a price change since is caught rather than charged. */
  expectedTotalCents: z.number().int().nonnegative(),
});

export type PlaceOrderRequest = z.input<typeof placeOrderRequestSchema>;
export type ParsedPlaceOrderRequest = z.output<typeof placeOrderRequestSchema>;

