import type { DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getDb } from "@/shared/lib/firebase/admin";
import { customerEmailsRef, customersRef, ordersRef } from "@/shared/lib/firebase/collections";

// Deletes a set of orders, plus each guest customer (and email lock) they
// leave with no orders and no password, as cleanupSmoke.ts does for one.
// Used by cleanupTestOrders.ts and demoOrders.ts --remove.

/** Firestore's batch limit is 500 writes. */
const BATCH_SIZE = 450;

export interface OrderRemoval {
  refs: DocumentReference[];
  /** One line per kept or removed customer, for the dry run. */
  lines: string[];
}

export async function planOrderRemoval(orders: readonly QueryDocumentSnapshot[]): Promise<OrderRemoval> {
  const removing = new Set(orders.map((doc) => doc.id));
  const refs: DocumentReference[] = orders.map((doc) => doc.ref);
  const lines: string[] = [];

  const customerIds = [...new Set(orders.map((doc) => doc.get("customerId") as string | null).filter(Boolean))] as string[];
  for (const customerId of customerIds) {
    const [customer, theirOrders] = await Promise.all([
      customersRef().doc(customerId).get(),
      ordersRef().where("customerId", "==", customerId).get(),
    ]);
    if (!customer.exists) continue;
    const email = customer.get("email") as string;
    const others = theirOrders.docs.filter((doc) => !removing.has(doc.id)).length;
    if (others > 0 || customer.get("passwordHash") !== null) {
      lines.push(`kept customer ${email} (${others > 0 ? `${others} other orders` : "has a password"})`);
      continue;
    }
    refs.push(customer.ref, customerEmailsRef().doc(email));
    lines.push(`guest customer ${email} and its email lock`);
  }
  return { refs, lines };
}

export async function deleteAll(refs: readonly DocumentReference[]): Promise<void> {
  for (let start = 0; start < refs.length; start += BATCH_SIZE) {
    const batch = getDb().batch();
    for (const ref of refs.slice(start, start + BATCH_SIZE)) batch.delete(ref);
    await batch.commit();
  }
}
