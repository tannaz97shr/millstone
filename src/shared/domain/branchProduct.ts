import type { BranchId, IsoDate, ProductId } from "./ids";

export interface BranchProduct {
  branchId: BranchId;
  productId: ProductId;
  isAvailable: boolean;
  /** Sold out for this one pickup date only; stops applying once it passes. */
  soldOutOn: IsoDate | null;
}

/**
 * One product at one branch as the admin shows it (A4): a missing row reads
 * as on the menu, and a sold-out date that has passed reads as null.
 */
export type AvailabilityState = Pick<BranchProduct, "isAvailable" | "soldOutOn">;
