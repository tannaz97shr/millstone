import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { BranchId, StaffUser, StaffUserId } from "@/shared/domain";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { StaffEmailLockDoc, StaffUserDoc } from "../types/staffDocs";
import { staffEmailLockSchema, staffUserDocSchema } from "./staffUserSchema";

export function toStaffUser(snapshot: DocumentSnapshot): StaffUser {
  const doc = parseDoc(staffUserDocSchema, snapshot);
  return {
    id: snapshot.id as StaffUserId,
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    branchId: doc.branchId as BranchId | null,
  };
}

export function staffUserToDoc(staffUser: Omit<StaffUser, "id">): StaffUserDoc {
  return {
    name: staffUser.name,
    email: staffUser.email,
    passwordHash: staffUser.passwordHash,
    role: staffUser.role,
    branchId: staffUser.branchId,
  };
}

export function toStaffUserIdFromEmailLock(snapshot: DocumentSnapshot): StaffUserId {
  return parseDoc(staffEmailLockSchema, snapshot).staffUserId as StaffUserId;
}

export function staffEmailLockToDoc(staffUserId: StaffUserId): StaffEmailLockDoc {
  return { staffUserId };
}
