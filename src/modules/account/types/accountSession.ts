import type { CustomerId } from "@/shared/domain";

/** The signed-in customer's details, as stored now. Prefills C5 and shows on C9. */
export interface AccountProfile {
  id: CustomerId;
  name: string;
  /** Digits only. */
  phone: string;
  email: string;
}

/**
 * GET /api/account/session. `customer` is null for a guest, and for a staff
 * session (staff never act as customers on the customer site).
 */
export interface AccountSessionResponse {
  customer: AccountProfile | null;
}
