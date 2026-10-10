import "server-only";
import type { z } from "zod";
import { readCustomerIdByEmail } from "@/modules/customers/lib/guestCustomer";
import { customerEmailLockToDoc, toCustomer } from "@/modules/customers/lib/toCustomer";
import type { CustomerId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { customerEmailsRef, customersRef } from "@/shared/lib/firebase/collections";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { AccountProfile } from "../types/accountSession";
import type { profileFormSchema } from "./accountSchemas";
import { ACCOUNT_WRITE_DEADLINE_MS, emailTaken } from "./signUpCustomer";

/**
 * C9 "Save details". New orders use these; past orders keep the details they
 * were placed with (they're copied onto each order). A new email moves the
 * customerEmails lock in the same transaction:
 * - nobody has it: the lock is created and the old one deleted;
 * - a guest record has it: the lock moves to this account. That guest's
 *   orders stay with the guest record, out of this account's history;
 * - another account has it: 409 `email_taken`, nothing written.
 */
export async function updateProfile(
  customerId: CustomerId,
  profile: z.output<typeof profileFormSchema>,
): Promise<AccountProfile> {
  const customerRef = customersRef().doc(customerId);

  const transaction = getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(customerRef);
    if (!snapshot.exists) throw new ApiError(401, "unauthenticated", "This account no longer exists");
    const current = toCustomer(snapshot);

    if (profile.email !== current.email) {
      const ownerId = await readCustomerIdByEmail(tx, profile.email);
      const owner = ownerId && ownerId !== customerId ? await tx.get(customersRef().doc(ownerId)) : null;
      if (owner?.exists && toCustomer(owner).passwordHash !== null) throw emailTaken();
      const oldLockOwner = await readCustomerIdByEmail(tx, current.email);

      // Writes, after every read.
      tx.set(customerEmailsRef().doc(profile.email), customerEmailLockToDoc(customerId));
      if (oldLockOwner === customerId) tx.delete(customerEmailsRef().doc(current.email));
    }
    tx.update(customerRef, { name: profile.name, phone: profile.phone, email: profile.email });
  });
  await withDeadline(
    transaction,
    ACCOUNT_WRITE_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Saving the profile took over ${ACCOUNT_WRITE_DEADLINE_MS}ms`),
  );
  return { id: customerId, name: profile.name, phone: profile.phone, email: profile.email };
}
