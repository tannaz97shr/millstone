import { branchToDoc } from "@/modules/branches/lib/toBranch";
import { branchProductToDoc } from "@/modules/catalog/lib/toBranchProduct";
import { productToDoc } from "@/modules/catalog/lib/toProduct";
import { FIRST_ORDER_NUMBER, orderCounterRef, orderCounterToDoc } from "@/modules/orders/lib/orderIds";
import {
  branchProductsRef,
  branchesRef,
  COLLECTIONS,
  productsRef,
} from "@/shared/lib/firebase/collections";
import { availablePickupDates } from "@/shared/utils/pickup-dates";
import { seedAvailability, type SoldOutSlot } from "../data/availability";
import { seedBranches } from "../data/branches";
import { seedProducts } from "../data/products";
import { upsertDoc, type WriteTally } from "./upsert";

const SLOT_INDEX: Record<SoldOutSlot, number> = { first: 0, second: 1 };

export async function seedBranchesAndCatalog(now: Date, tally: WriteTally): Promise<void> {
  for (const branch of seedBranches) {
    const { id, ...fields } = branch;
    tally.record(COLLECTIONS.branches, await upsertDoc(branchesRef().doc(id), branchToDoc(fields)));
  }

  for (const product of seedProducts) {
    const { id, ...fields } = product;
    tally.record(COLLECTIONS.products, await upsertDoc(productsRef().doc(id), productToDoc(fields)));
  }

  // Every branch × product row is written explicitly, even the defaults.
  for (const branch of seedBranches) {
    const availability = seedAvailability[branch.id];
    const pickupDates = availablePickupDates(branch, now, 2);
    for (const product of seedProducts) {
      const isAvailable = !availability.off.includes(product.id);
      const slot = availability.soldOut[product.id];
      const doc = branchProductToDoc({
        branchId: branch.id,
        productId: product.id,
        isAvailable,
        soldOutOn: isAvailable && slot ? pickupDates[SLOT_INDEX[slot]] : null,
      });
      tally.record(
        `branches/*/${COLLECTIONS.branchProducts}`,
        await upsertDoc(branchProductsRef(branch.id).doc(product.id), doc),
      );
    }
  }
}

/** Creates the order-number counter once; never resets an existing one. */
export async function seedOrderCounter(tally: WriteTally): Promise<void> {
  const ref = orderCounterRef();
  const snapshot = await ref.get();
  if (snapshot.exists) {
    tally.record(COLLECTIONS.counters, "unchanged");
    return;
  }
  await ref.create(orderCounterToDoc(FIRST_ORDER_NUMBER));
  tally.record(COLLECTIONS.counters, "created");
}
