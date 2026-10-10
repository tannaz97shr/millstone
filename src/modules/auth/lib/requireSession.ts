import "server-only";
import { findCustomerById, hasAccount } from "@/modules/customers/lib/findCustomer";
import { findStaffUserById } from "@/modules/staff/lib/findStaffUser";
import type { BranchId, Customer, StaffRole, StaffUserId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import type { SessionPrincipal } from "../types/session";
import { auth } from "./auth";

// Checked at the top of every API route that needs a session. proxy.ts
// doesn't cover /api, and a page's layout gate is never enough on its own.

/** The staff member behind a request, as stored now (not as the token remembers). */
export interface StaffActor {
  id: StaffUserId;
  name: string;
  role: StaffRole;
  /** Null for the owner. */
  branchId: BranchId | null;
}

/** Anyone signed in, else 401. */
export async function requireSession(): Promise<SessionPrincipal> {
  const session = await auth();
  if (!session?.principal) throw new ApiError(401, "unauthenticated", "Sign in first");
  return session.principal;
}

/**
 * A staff member or the owner, else 401 (no session, or the account is gone)
 * or 403 (another kind of session). Role and branch are re-read from
 * Firestore, so removing someone or moving them to another branch applies
 * on their next request.
 */
export async function requireStaffSession(): Promise<StaffActor> {
  const principal = await requireSession();
  if (principal.kind !== "staff") throw new ApiError(403, "forbidden", "Staff only");
  const staff = await findStaffUserById(principal.id);
  if (!staff) throw new ApiError(401, "unauthenticated", "This staff account no longer exists");
  return { id: staff.id, name: staff.name, role: staff.role, branchId: staff.branchId };
}

/** The owner, else 401 or 403. */
export async function requireOwnerSession(): Promise<StaffActor> {
  const actor = await requireStaffSession();
  if (actor.role !== "owner") throw new ApiError(403, "forbidden", "Owner only");
  return actor;
}

/** The customer behind a request, as stored now: their account's current details. */
export type CustomerActor = Customer & { passwordHash: string };

/**
 * A signed-in customer, else 401 (no session, or the account is gone) or 403
 * (a staff session: staff never act as customers). Details are re-read from
 * Firestore, so a profile edit applies at once.
 */
export async function requireCustomerSession(): Promise<CustomerActor> {
  const principal = await requireSession();
  if (principal.kind !== "customer") throw new ApiError(403, "forbidden", "Customers only");
  const customer = await findCustomerById(principal.id);
  if (!hasAccount(customer)) throw new ApiError(401, "unauthenticated", "This account no longer exists");
  return customer;
}

/**
 * The signed-in customer, or null for a guest or a staff session (a staff
 * member on the customer site counts as a guest). For public routes whose
 * answer depends on the account, like checkout and C7.
 */
export async function getOptionalCustomer(): Promise<CustomerActor | null> {
  const session = await auth();
  if (session?.principal?.kind !== "customer") return null;
  const customer = await findCustomerById(session.principal.id);
  return hasAccount(customer) ? customer : null;
}

/** Whether this staff member may see or change a branch's data. */
export function canAccessBranch(actor: StaffActor, branchId: BranchId): boolean {
  return actor.role === "owner" || actor.branchId === branchId;
}

/**
 * The branches a list may cover: the one asked for, or every branch (null)
 * for the owner; always their own for staff. Staff asking for another branch
 * get 403 (branches are public, so this gives nothing away).
 */
export function branchScope(actor: StaffActor, requested: BranchId | null): BranchId | null {
  if (actor.role === "owner") return requested;
  if (requested !== null && requested !== actor.branchId) {
    throw new ApiError(403, "forbidden", "Staff can only see their own branch");
  }
  return actor.branchId;
}
