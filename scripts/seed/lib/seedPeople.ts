import { customerEmailLockToDoc, customerToDoc, toCustomer, toCustomerIdFromEmailLock } from "@/modules/customers/lib/toCustomer";
import { staffEmailLockToDoc, staffUserToDoc, toStaffUser, toStaffUserIdFromEmailLock } from "@/modules/staff/lib/toStaffUser";
import type { CustomerId, IsoInstant, StaffUserId } from "@/shared/domain";
import { getDb } from "@/shared/lib/firebase/admin";
import {
  COLLECTIONS,
  customerEmailsRef,
  customersRef,
  staffEmailsRef,
  staffUsersRef,
} from "@/shared/lib/firebase/collections";
import { normalizeEmail, normalizePhone } from "@/shared/lib/firebase/fieldSchemas";
import { hashPassword, verifyPassword } from "@/shared/lib/password";
import type { SeedCustomer, SeedStaffUser } from "../data/people";
import { upsertDoc, type WriteTally } from "./upsert";

// People are found through their email lock doc, so reruns update the same
// record. A stored hash is kept while it still matches the env password, so a
// rerun doesn't re-salt and count as a change.

async function passwordHashFor(password: string, existingHash: string | null): Promise<string> {
  if (existingHash && (await verifyPassword(password, existingHash))) return existingHash;
  return hashPassword(password);
}

export async function seedStaffUser(
  user: SeedStaffUser,
  password: string,
  tally: WriteTally,
): Promise<void> {
  const email = normalizeEmail(user.email);
  const lockRef = staffEmailsRef().doc(email);
  const lockSnapshot = await lockRef.get();

  if (lockSnapshot.exists) {
    const userRef = staffUsersRef().doc(toStaffUserIdFromEmailLock(lockSnapshot));
    const userSnapshot = await userRef.get();
    const existingHash = userSnapshot.exists ? toStaffUser(userSnapshot).passwordHash : null;
    const doc = staffUserToDoc({
      name: user.name,
      email,
      passwordHash: await passwordHashFor(password, existingHash),
      role: user.role,
      branchId: user.branchId,
    });
    tally.record(COLLECTIONS.staffUsers, await upsertDoc(userRef, doc));
    tally.record(COLLECTIONS.staffEmails, "unchanged");
    return;
  }

  const userRef = staffUsersRef().doc();
  const doc = staffUserToDoc({
    name: user.name,
    email,
    passwordHash: await hashPassword(password),
    role: user.role,
    branchId: user.branchId,
  });
  // Lock and user land together; create() fails if the email is already taken.
  const batch = getDb().batch();
  batch.create(lockRef, staffEmailLockToDoc(userRef.id as StaffUserId));
  batch.set(userRef, doc);
  await batch.commit();
  tally.record(COLLECTIONS.staffUsers, "created");
  tally.record(COLLECTIONS.staffEmails, "created");
}

/** Creates or updates the customer; returns their ID for orders to link to. */
export async function seedCustomer(
  customer: SeedCustomer,
  password: string,
  now: Date,
  tally: WriteTally,
): Promise<CustomerId> {
  const email = normalizeEmail(customer.email);
  const lockRef = customerEmailsRef().doc(email);
  const lockSnapshot = await lockRef.get();

  if (lockSnapshot.exists) {
    const customerRef = customersRef().doc(toCustomerIdFromEmailLock(lockSnapshot));
    const customerSnapshot = await customerRef.get();
    const existing = customerSnapshot.exists ? toCustomer(customerSnapshot) : null;
    const doc = customerToDoc({
      name: customer.name,
      email,
      phone: normalizePhone(customer.phone),
      passwordHash: customer.hasAccount
        ? await passwordHashFor(password, existing?.passwordHash ?? null)
        : null,
      createdAt: existing?.createdAt ?? (now.toISOString() as IsoInstant),
    });
    tally.record(COLLECTIONS.customers, await upsertDoc(customerRef, doc));
    tally.record(COLLECTIONS.customerEmails, "unchanged");
    return customerRef.id as CustomerId;
  }

  const customerRef = customersRef().doc();
  const doc = customerToDoc({
    name: customer.name,
    email,
    phone: normalizePhone(customer.phone),
    passwordHash: customer.hasAccount ? await hashPassword(password) : null,
    createdAt: now.toISOString() as IsoInstant,
  });
  const batch = getDb().batch();
  batch.create(lockRef, customerEmailLockToDoc(customerRef.id as CustomerId));
  batch.set(customerRef, doc);
  await batch.commit();
  tally.record(COLLECTIONS.customers, "created");
  tally.record(COLLECTIONS.customerEmails, "created");
  return customerRef.id as CustomerId;
}
