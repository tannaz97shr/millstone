import type { BranchId, CustomerId, StaffRole, StaffUserId } from "@/shared/domain";

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
 * A signed-in customer (an account: a Customer with a password). Contact
 * details aren't carried: they're re-read on each request, so a profile edit
 * applies at once.
 */
export interface CustomerPrincipal {
  kind: "customer";
  id: CustomerId;
  name: string;
}

/**
 * Whoever a session belongs to. Staff checks refuse anything that isn't
 * `kind: "staff"`, and customer checks anything that isn't `kind: "customer"`.
 */
export type SessionPrincipal = StaffPrincipal | CustomerPrincipal;

export type PrincipalKind = SessionPrincipal["kind"];
