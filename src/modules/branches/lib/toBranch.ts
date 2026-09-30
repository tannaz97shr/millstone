import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { Branch, BranchId } from "@/shared/domain";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { BranchDoc } from "../types/branchDoc";
import { branchDocSchema } from "./branchSchema";

export function toBranch(snapshot: DocumentSnapshot): Branch {
  const doc = parseDoc(branchDocSchema, snapshot);
  return {
    id: snapshot.id as BranchId,
    name: doc.name,
    address: doc.address,
    phone: doc.phone,
    orderCutoffTime: doc.orderCutoffTime,
    opensAt: doc.opensAt,
    closedDays: doc.closedDays,
    notificationsEnabled: doc.notificationsEnabled,
  };
}

export function branchToDoc(branch: Omit<Branch, "id">): BranchDoc {
  return {
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    orderCutoffTime: branch.orderCutoffTime,
    opensAt: branch.opensAt,
    closedDays: branch.closedDays,
    notificationsEnabled: branch.notificationsEnabled,
  };
}
