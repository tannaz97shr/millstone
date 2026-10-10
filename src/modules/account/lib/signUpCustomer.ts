import "server-only";
import type { z } from "zod";
import { signInNewAccount } from "@/modules/auth/lib/signInCustomer";
import { createAccountCustomer, setCustomerPassword } from "@/modules/customers/lib/customerAccount";
import { readCustomerIdByEmail } from "@/modules/customers/lib/guestCustomer";
import { toCustomer } from "@/modules/customers/lib/toCustomer";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { customersRef } from "@/shared/lib/firebase/collections";
import { hashPassword } from "@/shared/lib/password";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { AccountRedirectResponse, signUpRequestSchema } from "./accountSchemas";

/** A transaction makes several round trips and may retry on contention. */
export const ACCOUNT_WRITE_DEADLINE_MS = 8_000;

export const emailTaken = () => new ApiError(409, "email_taken", "There's already an account for this email");

/**
 * C8 "Create an account" (AC-U1), then signs in.
 * - A new email: a new customer with a password, and its lock.
 * - A guest's email (a customer with no password): the password, name and
 *   mobile are set on that record (spec 5). Its earlier guest orders stay
 *   linked by email but out of the account's history (`accountId` null)
 *   until an email check exists: anyone could type someone else's email.
 * - An email with an account: 409 `email_taken`, nothing written.
 */
export async function signUpCustomer(
  request: z.output<typeof signUpRequestSchema>,
): Promise<AccountRedirectResponse> {
  const { name, phone, email, password, returnTo } = request;
  const passwordHash = await hashPassword(password);
  const now = new Date();

  const transaction = getDb().runTransaction(async (tx) => {
    const existingId = await readCustomerIdByEmail(tx, email);
    if (existingId === null) {
      createAccountCustomer(tx, { name, phone, email }, passwordHash, now);
      return;
    }
    const snapshot = await tx.get(customersRef().doc(existingId));
    // A lock without its customer is a broken record, not something to take over.
    if (!snapshot.exists) throw new Error(`customerEmails/${email} points at a missing customer`);
    if (toCustomer(snapshot).passwordHash !== null) throw emailTaken();
    setCustomerPassword(tx, existingId, { name, phone }, passwordHash);
  });
  await withDeadline(
    transaction,
    ACCOUNT_WRITE_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Creating an account took over ${ACCOUNT_WRITE_DEADLINE_MS}ms`),
  );

  return signInNewAccount({ email, password, returnTo, normalizedEmail: email });
}
