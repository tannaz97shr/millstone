import { describe, expect, test } from "bun:test";
import type { Cents } from "@/shared/domain";
import type { ProductFormValues } from "./productSchemas";
import { hasUnsavedChanges } from "./unsavedChanges";

const saved = {
  name: "Sourdough rye loaf",
  description: "800g, dark crust, caraway.",
  category: "Breads",
  priceCents: 950 as Cents,
  isActive: true,
};

const asSaved: ProductFormValues = {
  name: saved.name,
  description: saved.description,
  category: saved.category,
  newCategory: false,
  newCategoryName: "",
  price: "9.50",
  isActive: true,
};

const empty: ProductFormValues = {
  name: "",
  description: "",
  category: "",
  newCategory: false,
  newCategoryName: "",
  price: "",
  isActive: true,
};

describe("hasUnsavedChanges: editing", () => {
  test("the saved values are no change", () => {
    expect(hasUnsavedChanges(asSaved, saved, false)).toBe(false);
  });

  test("spacing and an equal price written differently are no change", () => {
    expect(hasUnsavedChanges({ ...asSaved, name: "  Sourdough  rye loaf ", price: "$9.5" }, saved, false)).toBe(false);
  });

  test("each field counts", () => {
    expect(hasUnsavedChanges({ ...asSaved, name: "Rye loaf" }, saved, false)).toBe(true);
    expect(hasUnsavedChanges({ ...asSaved, description: "" }, saved, false)).toBe(true);
    expect(hasUnsavedChanges({ ...asSaved, category: "Pastries" }, saved, false)).toBe(true);
    expect(hasUnsavedChanges({ ...asSaved, price: "10" }, saved, false)).toBe(true);
    expect(hasUnsavedChanges({ ...asSaved, isActive: false }, saved, false)).toBe(true);
  });

  test("an unreadable price is a change", () => {
    expect(hasUnsavedChanges({ ...asSaved, price: "9.5x" }, saved, false)).toBe(true);
    expect(hasUnsavedChanges({ ...asSaved, price: "" }, saved, false)).toBe(true);
  });

  test("New category opened but empty is no change; a typed one is", () => {
    expect(hasUnsavedChanges({ ...asSaved, newCategory: true, newCategoryName: "  " }, saved, false)).toBe(false);
    expect(hasUnsavedChanges({ ...asSaved, newCategory: true, newCategoryName: "Savoury" }, saved, false)).toBe(true);
    expect(hasUnsavedChanges({ ...asSaved, newCategory: true, newCategoryName: "Breads" }, saved, false)).toBe(false);
  });

  test("a chosen or preparing photo always counts", () => {
    expect(hasUnsavedChanges(asSaved, saved, true)).toBe(true);
  });
});

describe("hasUnsavedChanges: a new product", () => {
  test("an empty form is no change", () => {
    expect(hasUnsavedChanges(empty, null, false)).toBe(false);
    expect(hasUnsavedChanges({ ...empty, name: "   ", newCategory: true }, null, false)).toBe(false);
  });

  test("anything filled in counts", () => {
    expect(hasUnsavedChanges({ ...empty, name: "Olive fougasse" }, null, false)).toBe(true);
    expect(hasUnsavedChanges({ ...empty, category: "Breads" }, null, false)).toBe(true);
    expect(hasUnsavedChanges({ ...empty, newCategory: true, newCategoryName: "Savoury" }, null, false)).toBe(true);
    expect(hasUnsavedChanges({ ...empty, price: "4" }, null, false)).toBe(true);
    expect(hasUnsavedChanges({ ...empty, isActive: false }, null, false)).toBe(true);
    expect(hasUnsavedChanges(empty, null, true)).toBe(true);
  });
});
