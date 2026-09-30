import type { BranchId, IsoDate, ProductId } from "./ids";

export interface BranchProduct {
  branchId: BranchId;
  productId: ProductId;
  isAvailable: boolean;
  /** Sold out for this one pickup date only; stops applying once it passes. */
  soldOutOn: IsoDate | null;
}
