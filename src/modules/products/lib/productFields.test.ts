import { describe, expect, test } from "bun:test";
import {
  PHOTO_BODY_MAX_BYTES,
  PHOTO_MAX_WIDTH,
  browserResizeSize,
  isLargeEnough,
  isPhotoFormat,
  photoTargetSize,
} from "./photoRules";
import {
  formatPriceInput,
  normaliseCategory,
  parsePriceInput,
  productSlug,
  slugCandidates,
  tidyText,
} from "./productFields";
import { productFormSchema, productInputSchema, productUpdateSchema, toProductInput } from "./productSchemas";

describe("parsePriceInput", () => {
  test("dollars with up to two decimals, with or without $", () => {
    expect(parsePriceInput("9.50")).toBe(950);
    expect(parsePriceInput("$9.5")).toBe(950);
    expect(parsePriceInput(" 9 ")).toBe(900);
    expect(parsePriceInput("$ 12.05")).toBe(1205);
    expect(parsePriceInput("0.80")).toBe(80);
    expect(parsePriceInput("999.99")).toBe(99_999);
  });

  test("refuses anything else, zero and over $999.99", () => {
    for (const input of ["", "abc", "9.555", "9,50", "-3", "0", "0.00", "1000", "9.", ".5", "1e3"]) {
      expect(parsePriceInput(input)).toBeNull();
    }
  });

  test("formatPriceInput round-trips", () => {
    expect(formatPriceInput(950)).toBe("9.50");
    expect(parsePriceInput(formatPriceInput(480))).toBe(480);
  });
});

describe("categories and text", () => {
  test("tidyText trims and collapses spaces", () => {
    expect(tidyText("  Cakes   &  tarts ")).toBe("Cakes & tarts");
  });

  test("a typed category matching an existing one becomes that one", () => {
    expect(normaliseCategory(" breads ", ["Breads", "Pastries"])).toBe("Breads");
    expect(normaliseCategory("Savoury", ["Breads"])).toBe("Savoury");
    expect(normaliseCategory("savoury  pies", ["Breads"])).toBe("savoury pies");
  });
});

describe("product slugs", () => {
  test("from the name, with a fallback", () => {
    expect(productSlug("Olive fougasse")).toBe("olive-fougasse");
    expect(productSlug("Crème brûlée tart!")).toBe("creme-brulee-tart");
    expect(productSlug("!!!")).toBe("product");
  });

  test("long names leave room for a suffix", () => {
    const slug = productSlug("a".repeat(100));
    expect(slug.length).toBe(61);
    expect(`${slug}-20`.length).toBeLessThanOrEqual(64);
  });

  test("candidates: the slug, then -2, -3…", () => {
    const list = slugCandidates("Rye");
    expect(list.slice(0, 3)).toEqual(["rye", "rye-2", "rye-3"]);
    expect(list).toHaveLength(20);
  });
});

describe("photo rules", () => {
  test("only JPEG, PNG and WebP decoders", () => {
    expect(isPhotoFormat("jpeg")).toBe(true);
    expect(isPhotoFormat("png")).toBe(true);
    expect(isPhotoFormat("webp")).toBe(true);
    for (const format of ["gif", "svg", "heif", "tiff", "avif", undefined]) expect(isPhotoFormat(format)).toBe(false);
  });

  test("the largest 4:3 box inside the image, capped at 1200 × 900", () => {
    expect(photoTargetSize(4032, 3024)).toEqual({ width: 1200, height: 900 });
    expect(photoTargetSize(3024, 4032)).toEqual({ width: 1200, height: 900 });
    expect(photoTargetSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(photoTargetSize(1000, 500)).toEqual({ width: 664, height: 498 });
    expect(photoTargetSize(PHOTO_MAX_WIDTH * 3, 10_000).width).toBe(PHOTO_MAX_WIDTH);
  });

  test("never upscales and always 4:3", () => {
    for (const [w, h] of [[401, 301], [999, 1001], [1600, 1199], [5000, 300]]) {
      const size = photoTargetSize(w, h);
      expect(size.width).toBeLessThanOrEqual(w);
      expect(size.height).toBeLessThanOrEqual(h);
      expect(size.width * 3).toBe(size.height * 4);
    }
  });

  test("minimum size", () => {
    expect(isLargeEnough(400, 300)).toBe(true);
    expect(isLargeEnough(399, 300)).toBe(false);
    expect(isLargeEnough(400, 299)).toBe(false);
  });
});

describe("the product form and the API body", () => {
  const valid = {
    name: "  Olive   fougasse ",
    description: "Olive oil, rosemary, Kalamata olives.",
    category: "",
    newCategory: true,
    newCategoryName: " Savoury ",
    price: "$7",
    isActive: true,
  };

  const errors = (values: typeof valid) => {
    const result = productFormSchema.safeParse(values);
    return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  };

  test("valid form values become a body the API accepts", () => {
    expect(errors(valid)).toEqual({});
    const body = toProductInput(valid);
    expect(body).toEqual({
      name: "Olive fougasse",
      description: "Olive oil, rosemary, Kalamata olives.",
      category: "Savoury",
      priceCents: 700,
      isActive: true,
    });
    expect(productInputSchema.safeParse(body).success).toBe(true);
  });

  test("an empty submit reports every field at once, with the canvas's words", () => {
    expect(errors({ ...valid, name: " ", newCategory: false, category: "", price: "" })).toEqual({
      name: "Give it a name, like it would read on the menu.",
      category: "Choose a category.",
      price: "Enter the price in dollars, like 9.50.",
    });
    expect(errors({ ...valid, newCategoryName: "  " })).toEqual({ newCategoryName: "Name the new category." });
  });

  test("length limits", () => {
    expect(Object.keys(errors({ ...valid, name: "x".repeat(61) }))).toEqual(["name"]);
    expect(Object.keys(errors({ ...valid, description: "x".repeat(161) }))).toEqual(["description"]);
    expect(Object.keys(errors({ ...valid, newCategoryName: "x".repeat(31) }))).toEqual(["newCategoryName"]);
  });

  test("an existing category is used when New category isn't pressed", () => {
    expect(toProductInput({ ...valid, newCategory: false, category: "Breads" }).category).toBe("Breads");
  });

  test("the API refuses what the form would refuse", () => {
    const body = toProductInput(valid);
    expect(productInputSchema.safeParse({ ...body, name: "   " }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...body, priceCents: 0 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...body, priceCents: 9.5 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...body, priceCents: 100_000 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...body, category: "x".repeat(31) }).success).toBe(false);
    expect(productUpdateSchema.safeParse(body).success).toBe(false);
    expect(productUpdateSchema.safeParse({ ...body, expectedVersion: 3 }).success).toBe(true);
  });
});

describe("browserResizeSize", () => {
  test("a 12 MP phone photo shrinks to 2048 on the long edge, either way up", () => {
    expect(browserResizeSize(4032, 3024)).toEqual({ width: 2048, height: 1536 });
    expect(browserResizeSize(3024, 4032)).toEqual({ width: 1536, height: 2048 });
  });

  test("never upscales a small photo", () => {
    expect(browserResizeSize(1600, 1200)).toEqual({ width: 1600, height: 1200 });
    expect(browserResizeSize(500, 400)).toEqual({ width: 500, height: 400 });
  });

  test("a wide panorama keeps enough height for the full 4:3 crop", () => {
    const shrunk = browserResizeSize(8000, 1000);
    expect(shrunk).toEqual({ width: 7200, height: 900 });
    expect(photoTargetSize(shrunk.width, shrunk.height)).toEqual(photoTargetSize(8000, 1000));
  });

  test("the server's crop is the same from the shrunk copy as from the original", () => {
    for (const [w, h] of [[4032, 3024], [3024, 4032], [6000, 4000], [4000, 6000], [5000, 900], [900, 5000]]) {
      const shrunk = browserResizeSize(w, h);
      expect(photoTargetSize(shrunk.width, shrunk.height)).toEqual(photoTargetSize(w, h));
    }
  });
});

test("the photo body cap stays under Vercel's 4.5 MB request limit", () => {
  expect(PHOTO_BODY_MAX_BYTES).toBeLessThan(4.5 * 1024 * 1024);
});
