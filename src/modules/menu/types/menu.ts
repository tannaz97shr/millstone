import type { BranchId, Cents, IsoDate, ProductId } from "@/shared/domain";

export interface MenuProduct {
  id: ProductId;
  name: string;
  description: string;
  priceCents: Cents;
  /** Token-gated download URL, or null for the letter placeholder. */
  imageUrl: string | null;
  /** Sold out for the menu's pickup date. */
  soldOut: boolean;
}

export interface MenuCategory {
  name: string;
  /** For the category links, e.g. "breads". */
  slug: string;
  products: MenuProduct[];
}

/** GET /api/branches/{branchId}/menu?date= : one branch's menu for one pickup date. */
export interface BranchMenu {
  branchId: BranchId;
  date: IsoDate;
  categories: MenuCategory[];
}
