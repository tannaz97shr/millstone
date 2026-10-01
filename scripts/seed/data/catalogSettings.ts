import type { CatalogSettings } from "@/shared/domain";

// Menu order from the C2 design. The owner's new categories (A5) are appended.
export const seedCatalogSettings: CatalogSettings = {
  categoryOrder: ["Breads", "Pastries", "Bagels"],
};
