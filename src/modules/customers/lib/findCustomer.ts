import "server-only";
import type { Customer, CustomerId } from "@/shared/domain";
import { customerEmailsRef, customersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { toCustomer, toCustomerIdFromEmailLock } from "./toCustomer";

/** By normalized email, through the customerEmails lock doc. Null when nobody has that email. */
export async function findCustomerByEmail(normalizedEmail: string): Promise<Customer | null> {
  const lock = await firestoreRead(customerEmailsRef().doc(normalizedEmail).get(), "customerEmails");
  if (!lock.exists) return null;
  return findCustomerById(toCustomerIdFromEmailLock(lock));
}

export async function findCustomerById(customerId: CustomerId): Promise<Customer | null> {
  const snapshot = await firestoreRead(customersRef().doc(customerId).get(), "customers");
  return snapshot.exists ? toCustomer(snapshot) : null;
}

/** An account is a customer with a password (spec 5: a guest has none). */
export const hasAccount = (customer: Customer | null): customer is Customer & { passwordHash: string } =>
  customer?.passwordHash != null;
