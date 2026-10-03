import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import type { CustomerId, IsoInstant } from "@/shared/domain";
import { customerEmailsRef, customersRef } from "@/shared/lib/firebase/collections";
import { customerEmailLockToDoc, customerToDoc, toCustomerIdFromEmailLock } from "./toCustomer";

// Guest checkout's customer (spec 5: a guest is a Customer with no password).
// Both run inside the order's transaction: the lock read with the other reads,
// the create with the other writes.

/** The customer who owns this email (already normalised), or null when nobody does yet. */
export async function readCustomerIdByEmail(
  transaction: Transaction,
  email: string,
): Promise<CustomerId | null> {
  const lock = await transaction.get(customerEmailsRef().doc(email));
  return lock.exists ? toCustomerIdFromEmailLock(lock) : null;
}

export interface GuestDetails {
  name: string;
  /** Normalised. */
  email: string;
  /** Digits only. */
  phone: string;
}

/**
 * Creates a guest customer and its email lock. Both are create(), so if the
 * email was taken since it was read, the transaction fails rather than making
 * a second customer for it.
 */
export function createGuestCustomer(
  transaction: Transaction,
  guest: GuestDetails,
  now: Date,
): CustomerId {
  const customerRef = customersRef().doc();
  const customerId = customerRef.id as CustomerId;
  transaction.create(customerEmailsRef().doc(guest.email), customerEmailLockToDoc(customerId));
  transaction.create(
    customerRef,
    customerToDoc({ ...guest, passwordHash: null, createdAt: now.toISOString() as IsoInstant }),
  );
  return customerId;
}
