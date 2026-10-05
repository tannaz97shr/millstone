import { z } from "zod";
import type { Cents } from "@/shared/domain";
import { productsContent } from "../content/productsContent";
import {
  CATEGORY_NAME_MAX,
  parsePriceInput,
  PRICE_MAX_CENTS,
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_NAME_MAX,
  tidyText,
} from "./productFields";

// A5's form (React Hook Form, strings as typed) and the API body it becomes
// (toProductInput). Both use the same limits and tidying from productFields,
// so whatever the form accepts the API accepts too.

const content = productsContent.form;

export const productFormSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    /** An existing category, or "" before one is chosen. */
    category: z.string(),
    /** "New category" is pressed: newCategoryName is used instead. */
    newCategory: z.boolean(),
    newCategoryName: z.string(),
    /** Dollars as typed, e.g. "9.50". */
    price: z.string(),
    isActive: z.boolean(),
  })
  // Every rule lives here, so one submit reports every field at once.
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    const name = tidyText(values.name);
    if (!name) issue("name", content.name.required);
    else if (name.length > PRODUCT_NAME_MAX) issue("name", content.name.tooLong);
    if (tidyText(values.description).length > PRODUCT_DESCRIPTION_MAX) {
      issue("description", content.description.tooLong);
    }
    if (values.newCategory) {
      const typed = tidyText(values.newCategoryName);
      if (!typed) issue("newCategoryName", content.category.newRequired);
      else if (typed.length > CATEGORY_NAME_MAX) issue("newCategoryName", content.category.newTooLong);
    } else if (!values.category) {
      issue("category", content.category.required);
    }
    if (parsePriceInput(values.price) === null) issue("price", content.price.invalid);
  });

export type ProductFormValues = z.input<typeof productFormSchema>;

/** The order React Hook Form's errors are reported and focused in: the form's order. */
export const PRODUCT_FORM_FIELDS = ["name", "description", "category", "newCategoryName", "price"] as const;

const tidied = (max: number, min: number) =>
  z
    .string()
    .max(max * 4)
    .transform(tidyText)
    .pipe(z.string().min(min).max(max));

/** POST /api/admin/products */
export const productInputSchema = z.object({
  name: tidied(PRODUCT_NAME_MAX, 1),
  description: tidied(PRODUCT_DESCRIPTION_MAX, 0),
  /** Existing or new; the server matches it to an existing one ignoring case. */
  category: tidied(CATEGORY_NAME_MAX, 1),
  priceCents: z.number().int().positive().max(PRICE_MAX_CENTS),
  isActive: z.boolean(),
});

/** PATCH /api/admin/products/{id}: the same, plus the version the form read. */
export const productUpdateSchema = productInputSchema.extend({
  expectedVersion: z.number().int().nonnegative(),
});

export type ProductInput = z.output<typeof productInputSchema>;
export type ProductInputRequest = z.input<typeof productInputSchema>;
export type ProductUpdateRequest = z.input<typeof productUpdateSchema>;

/** Valid form values (after productFormSchema) → the API body. */
export function toProductInput(values: ProductFormValues): ProductInputRequest {
  return {
    name: tidyText(values.name),
    description: tidyText(values.description),
    category: tidyText(values.newCategory ? values.newCategoryName : values.category),
    priceCents: parsePriceInput(values.price) as Cents,
    isActive: values.isActive,
  };
}
