import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import type { CustomerId, IsoInstant } from "@/shared/domain";
import { customerEmailsRef, customersRef } from "@/shared/lib/firebase/collections";
import type { GuestDetails } from "./guestCustomer";
import { customerEmailLockToDoc, customerToDoc } from "./toCustomer";

// Writes that make or change an account, inside the caller's transaction.
// Passwords arrive already hashed: scrypt is slow, and a transaction may run
// its function more than once.

/** Contact details an account keeps (normalised: email lowercased, phone digits). */
export type AccountDetails = GuestDetails;

/** A brand-new account and its email lock. create() both, so a race fails instead of duplicating. */
export function createAccountCustomer(
  transaction: Transaction,
  details: AccountDetails,
  passwordHash: string,
  now: Date,
): CustomerId {
  const customerRef = customersRef().doc();
  const customerId = customerRef.id as CustomerId;
  transaction.create(customerEmailsRef().doc(details.email), customerEmailLockToDoc(customerId));
  transaction.create(
    customerRef,
    customerToDoc({ ...details, passwordHash, createdAt: now.toISOString() as IsoInstant }),
  );
  return customerId;
}

/**
 * Sets the password on an existing customer, with the name and mobile they
 * gave, turning a guest record into an account (spec 5, AC-U1). Its email and
 * lock are unchanged. A later email reset would write `passwordHash` the same
 * way, once a reset link has proved the email.
 */
export function setCustomerPassword(
  transaction: Transaction,
  customerId: CustomerId,
  details: Pick<AccountDetails, "name" | "phone">,
  passwordHash: string,
): void {
  transaction.update(customersRef().doc(customerId), {
    name: details.name,
    phone: details.phone,
    passwordHash,
  });
}
