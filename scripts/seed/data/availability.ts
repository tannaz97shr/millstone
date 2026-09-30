import type { BranchId, ProductId } from "@/shared/domain";
import { BRUNSWICK, FITZROY, NORTHCOTE } from "./branches";
import { PRODUCT_IDS } from "./products";

// Per-branch availability, following design/admin/Availability.dc.html.
// Sold-out dates are relative to the real clock at seed time: "first" is the
// branch's earliest pickup date, "second" the next orderable one.

export type SoldOutSlot = "first" | "second";

export interface BranchAvailability {
  off: ProductId[];
  soldOut: Partial<Record<ProductId, SoldOutSlot>>;
}

export const seedAvailability: Record<BranchId, BranchAvailability> = {
  [NORTHCOTE]: {
    off: [],
    soldOut: {
      [PRODUCT_IDS.seeded]: "first",
      [PRODUCT_IDS.almondCroissant]: "second",
    },
  },
  [FITZROY]: {
    off: [PRODUCT_IDS.rye, PRODUCT_IDS.fruit],
    soldOut: { [PRODUCT_IDS.cinnamonScroll]: "first" },
  },
  [BRUNSWICK]: {
    // Fruit loaf is also off here so it's a Northcote-only product
    // (no design has a branch-only product; see specs/known-issues.md).
    off: [PRODUCT_IDS.everythingBagel, PRODUCT_IDS.fruit],
    soldOut: {},
  },
};
