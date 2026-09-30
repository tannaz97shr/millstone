import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import type { IsoDate, OrderId, RecurringOrderId } from "@/shared/domain";
import { COUNTER_IDS, countersRef } from "@/shared/lib/firebase/collections";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { OrderCounterDoc } from "../types/orderDocs";
import { orderCounterDocSchema } from "./orderSchema";

const ORDER_NUMBER_PREFIX = "MS-";

/** The first order number handed out on a fresh database. */
export const FIRST_ORDER_NUMBER = 1001;

export const orderCounterRef = () => countersRef().doc(COUNTER_IDS.orders);

export function formatOrderNumber(sequence: number): string {
  return `${ORDER_NUMBER_PREFIX}${sequence}`;
}

export function orderCounterToDoc(next: number): OrderCounterDoc {
  return { next };
}

/**
 * Takes the next order number inside the caller's transaction, so two
 * checkouts can never get the same one. Call before any transaction writes.
 */
export async function allocateOrderNumber(transaction: Transaction): Promise<string> {
  const snapshot = await transaction.get(orderCounterRef());
  const next = snapshot.exists
    ? parseDoc(orderCounterDocSchema, snapshot).next
    : FIRST_ORDER_NUMBER;
  transaction.set(orderCounterRef(), orderCounterToDoc(next + 1));
  return formatOrderNumber(next);
}

/**
 * Deterministic ID for an order generated from a recurring order. Created with
 * `create()`, so a second run for the same pickup date fails instead of duplicating.
 */
export function generatedOrderId(recurringOrderId: RecurringOrderId, pickupDate: IsoDate): OrderId {
  return `${recurringOrderId}_${pickupDate}` as OrderId;
}
