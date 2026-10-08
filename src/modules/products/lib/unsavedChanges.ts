import type { AdminProduct } from "../types/adminProduct";
import { parsePriceInput, tidyText } from "./productFields";
import type { ProductFormValues } from "./productSchemas";

// Whether closing A5's panel would lose something (the "Discard changes?"
// prompt). Pure: the form's values against the product as last saved.

type SavedFields = Pick<AdminProduct, "name" | "description" | "category" | "priceCents" | "isActive">;

/** The category the form would save; null while "New category" is open but empty. */
function chosenCategory(values: ProductFormValues): string | null {
  const category = tidyText(values.newCategory ? values.newCategoryName : values.category);
  return category === "" && values.newCategory ? null : category;
}

function changedFrom(saved: SavedFields, values: ProductFormValues): boolean {
  const category = chosenCategory(values);
  const price = parsePriceInput(values.price);
  return (
    tidyText(values.name) !== saved.name ||
    tidyText(values.description) !== saved.description ||
    (category !== null && category !== saved.category) ||
    // "9.5" for $9.50 is the same price; anything unreadable counts as a change.
    price !== saved.priceCents ||
    values.isActive !== saved.isActive
  );
}

function filledIn(values: ProductFormValues): boolean {
  return (
    tidyText(values.name) !== "" ||
    tidyText(values.description) !== "" ||
    (chosenCategory(values) ?? "") !== "" ||
    values.price.trim() !== "" ||
    !values.isActive
  );
}

/**
 * True when the form differs from `saved` (or, for a new product, has
 * anything in it), or a photo is chosen or still being prepared.
 */
export function hasUnsavedChanges(
  values: ProductFormValues,
  saved: SavedFields | null,
  photoPending: boolean,
): boolean {
  if (photoPending) return true;
  return saved ? changedFrom(saved, values) : filledIn(values);
}
