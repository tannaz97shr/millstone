import { z } from "zod";
import { MAX_QUANTITY } from "@/modules/cart/lib/cartLogic";
import { CONTACT_LIMITS } from "@/modules/checkout/lib/checkoutSchema";
import type { IsoDate, ProductId, Weekday } from "@/shared/domain";
import { recurringContent } from "../content/recurringContent";
import type { RecurringOrderDetail } from "../types/recurringOrderView";
import { daysText } from "./recurringText";
import type { createRecurringRequestSchema, updateRecurringRequestSchema } from "./recurringSchemas";

// C11's form: what the customer fills in, checked with the designed field
// errors, then turned into the API's request. The server checks it all again
// (recurringSchemas.ts) and adds the rules that need the branch and the clock.

const errors = recurringContent.errors;

export const recurringFormSchema = z
  .object({
    branchId: z.string().min(1, errors.branch),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6).transform((day) => day as Weekday))
      .min(1, errors.days),
    quantities: z
      .record(z.string(), z.number().int().min(0).max(MAX_QUANTITY))
      .refine((quantities) => Object.values(quantities).some((quantity) => quantity > 0), errors.items),
    startsOn: z.string().transform((date) => date as IsoDate),
    hasEnd: z.boolean(),
    endsOn: z
      .string()
      .transform((date) => date as IsoDate)
      .nullable(),
    notes: z.string().max(CONTACT_LIMITS.notes, errors.notesTooLong),
  })
  .superRefine((values, ctx) => {
    if (!values.hasEnd) return;
    if (values.endsOn === null) ctx.addIssue({ code: "custom", path: ["endsOn"], message: errors.endsOn });
    else if (values.endsOn < values.startsOn) {
      ctx.addIssue({ code: "custom", path: ["endsOn"], message: errors.endBeforeStart });
    }
  });

/**
 * What the form holds. `branchId` is empty until chosen (create) and fixed
 * when editing; `quantities` maps product IDs to quantities, 0 meaning "not
 * in the order".
 */
export type RecurringFormValues = z.input<typeof recurringFormSchema>;
export type RecurringFormOutput = z.output<typeof recurringFormSchema>;

/** The fields in the order the form shows them, for focusing the first one to fix. */
export const FORM_FIELD_ORDER = ["branchId", "daysOfWeek", "quantities", "startsOn", "endsOn", "notes"] as const;

export function blankFormValues(startsOn: IsoDate): RecurringFormValues {
  return { branchId: "", daysOfWeek: [], quantities: {}, startsOn, hasEnd: false, endsOn: null, notes: "" };
}

export function formValuesFromDetail(detail: RecurringOrderDetail): RecurringFormValues {
  return {
    branchId: detail.branch.id,
    daysOfWeek: [...detail.daysOfWeek],
    quantities: Object.fromEntries(detail.items.map((item) => [item.productId, item.quantity])),
    startsOn: detail.startsOn,
    hasEnd: detail.endsOn !== null,
    endsOn: detail.endsOn,
    notes: detail.notes,
  };
}

/** The chosen lines, in the order the form lists the products. */
export function chosenItems(
  quantities: Readonly<Record<string, number>>,
  productOrder: readonly string[],
): { productId: ProductId; quantity: number }[] {
  return productOrder
    .filter((productId) => (quantities[productId] ?? 0) > 0)
    .map((productId) => ({ productId: productId as ProductId, quantity: quantities[productId] }));
}

/** Quantities for products the form can't show any more (another branch, gone from the menu) are dropped. */
export function keepListed(
  quantities: Readonly<Record<string, number>>,
  listed: ReadonlySet<string>,
): Record<string, number> {
  return Object.fromEntries(Object.entries(quantities).filter(([productId]) => listed.has(productId)));
}

type CreateRequestInput = z.input<typeof createRecurringRequestSchema>;
type UpdateRequestInput = z.input<typeof updateRecurringRequestSchema>;

function fields(values: RecurringFormOutput, productOrder: readonly string[]) {
  return {
    daysOfWeek: [...values.daysOfWeek].sort((a, b) => a - b),
    items: chosenItems(values.quantities, productOrder),
    startsOn: values.startsOn,
    endsOn: values.hasEnd ? values.endsOn : null,
    notes: values.notes.trim(),
  };
}

export function toCreateRequest(values: RecurringFormOutput, productOrder: readonly string[]): CreateRequestInput {
  return { branchId: values.branchId, ...fields(values, productOrder) };
}

export function toUpdateRequest(
  values: RecurringFormOutput,
  productOrder: readonly string[],
  expectedVersion: number,
): UpdateRequestInput {
  return { ...fields(values, productOrder), expectedVersion };
}

/** The footer line: "18 items · Tue, Thu and Sat · Northcote". */
export function formSummary(
  values: Pick<RecurringFormValues, "daysOfWeek" | "quantities">,
  listed: readonly string[],
  branchName: string | null,
): string {
  const text = recurringContent.form;
  const count = listed.reduce((total, productId) => total + (values.quantities[productId] ?? 0), 0);
  const days = values.daysOfWeek.length ? daysText(values.daysOfWeek as Weekday[]) : text.noDays;
  return text.summary(recurringContent.common.itemCount(count), days, branchName);
}
