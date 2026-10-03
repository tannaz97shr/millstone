import "server-only";
import type { StaffUser, StaffUserId } from "@/shared/domain";
import { staffEmailsRef, staffUsersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { toStaffUser, toStaffUserIdFromEmailLock } from "./toStaffUser";

/** By normalized email, through the staffEmails lock doc. Null when there's no such staff member. */
export async function findStaffUserByEmail(normalizedEmail: string): Promise<StaffUser | null> {
  const lock = await firestoreRead(staffEmailsRef().doc(normalizedEmail).get(), "staffEmails");
  if (!lock.exists) return null;
  return findStaffUserById(toStaffUserIdFromEmailLock(lock));
}

export async function findStaffUserById(staffUserId: StaffUserId): Promise<StaffUser | null> {
  const snapshot = await firestoreRead(staffUsersRef().doc(staffUserId).get(), "staffUsers");
  return snapshot.exists ? toStaffUser(snapshot) : null;
}
