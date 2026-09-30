import type { StaffRole } from "./enums";
import type { BranchId, StaffUserId } from "./ids";

export interface StaffUser {
  id: StaffUserId;
  name: string;
  /** Lowercased and trimmed; unique. */
  email: string;
  passwordHash: string;
  role: StaffRole;
  /** Null for the owner, who sees every branch. */
  branchId: BranchId | null;
}
