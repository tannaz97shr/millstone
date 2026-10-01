import type { BranchId, IsoDate, ProductId } from "@/shared/domain";

export interface CartLine {
  quantity: number;
  /** For "we took X out" messages only; prices always come from the live menu. */
  name: string;
}

export interface CartPlace {
  branchId: BranchId;
  pickupDate: IsoDate;
}

/**
 * The customer's order before checkout. Client-side only (localStorage), tied
 * to one branch and pickup date. Never holds a price.
 */
export interface Cart extends CartPlace {
  version: 1;
  items: Partial<Record<ProductId, CartLine>>;
  /**
   * The branch and date the items were last checked against a menu. When the
   * branch has changed since, items missing from the new menu are ones the
   * new branch doesn't make (AC-C2).
   */
  checkedAgainst: CartPlace | null;
}

/** Items taken out of the cart, by reason, as product names. */
export interface CartRemovals {
  notMadeHere: string[];
  soldOut: string[];
  noLongerOffered: string[];
}
