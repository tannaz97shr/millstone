import type { BranchId, StaffRole, StaffUserId } from "@/shared/domain";

/** A signed-in staff member, as carried in the session token. */
export interface StaffPrincipal {
  kind: "staff";
  id: StaffUserId;
  name: string;
  role: StaffRole;
  /** Null for the owner, who sees every branch. */
  branchId: BranchId | null;
}

/**
 * Whoever a session belongs to. The accounts step adds a `{ kind: "customer" }`
 * arm with its own provider; staff checks already refuse anything that isn't
 * `kind: "staff"`.
 */
export type SessionPrincipal = StaffPrincipal;
