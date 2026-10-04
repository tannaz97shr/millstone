import type { Product, ProductId } from "@/shared/domain";

// Names, descriptions, categories and prices from the design canvases
// (design/customer/Menu.dc.html, design/admin/Products.dc.html). No photos yet,
// so every product shows its letter placeholder.

const product = (
  id: string,
  category: string,
  name: string,
  priceCents: number,
  description: string,
  isActive = true,
): Product => ({
  id: id as ProductId,
  name,
  description,
  category,
  priceCents,
  image: null,
  isActive,
  version: 0,
});

export const PRODUCT_IDS = {
  rye: "sourdough-rye-loaf" as ProductId,
  seeded: "seeded-sandwich-loaf" as ProductId,
  fruit: "fruit-loaf" as ProductId,
  almondCroissant: "almond-croissant" as ProductId,
  cinnamonScroll: "cinnamon-scroll" as ProductId,
  everythingBagel: "everything-bagel" as ProductId,
};

export const seedProducts: Product[] = [
  product(PRODUCT_IDS.rye, "Breads", "Sourdough rye loaf", 950, "800g, dark crust, caraway."),
  product(PRODUCT_IDS.seeded, "Breads", "Seeded sandwich loaf", 850, "Sliced, for the week."),
  product("white-sourdough", "Breads", "White sourdough", 800, "Long ferment, open crumb."),
  product(PRODUCT_IDS.fruit, "Breads", "Fruit loaf", 750, "Raisins and orange peel."),
  product(
    "pumpkin-loaf",
    "Breads",
    "Pumpkin loaf",
    800,
    "Roast pumpkin and pepitas. Autumn only.",
    false,
  ),
  product(PRODUCT_IDS.almondCroissant, "Pastries", "Almond croissant", 600, "Twice-baked, frangipane."),
  product("butter-croissant", "Pastries", "Butter croissant", 480, "Laminated by hand."),
  product(PRODUCT_IDS.cinnamonScroll, "Pastries", "Cinnamon scroll", 500, "Brown sugar, cardamom."),
  product("apple-turnover", "Pastries", "Apple turnover", 550, "Stewed apple, flaky pastry."),
  product("plain-bagel", "Bagels", "Plain bagel", 280, "Boiled, then baked."),
  product("sesame-bagel", "Bagels", "Sesame bagel", 300, "Toasted sesame crust."),
  product("poppy-seed-bagel", "Bagels", "Poppy seed bagel", 300, "Blue poppy seed crust."),
  product(
    PRODUCT_IDS.everythingBagel,
    "Bagels",
    "Everything bagel",
    320,
    "Seeds, garlic, onion, salt.",
  ),
];
