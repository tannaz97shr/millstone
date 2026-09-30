import "server-only";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  BranchId,
  CustomerId,
  ProductId,
  RecurringOrder,
  RecurringOrderId,
  RecurringOrderItem,
} from "@/shared/domain";
import { timestampToIso } from "@/shared/lib/firebase/fieldSchemas";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { RecurringOrderDoc, RecurringOrderItemDoc } from "../types/recurringOrderDoc";
import { recurringOrderDocSchema } from "./recurringOrderSchema";

function toRecurringOrderItem(item: RecurringOrderItemDoc): RecurringOrderItem {
  return { productId: item.productId as ProductId, quantity: item.quantity };
}

export function toRecurringOrder(snapshot: DocumentSnapshot): RecurringOrder {
  const doc = parseDoc(recurringOrderDocSchema, snapshot);
  return {
    id: snapshot.id as RecurringOrderId,
    customerId: doc.customerId as CustomerId,
    branchId: doc.branchId as BranchId,
    daysOfWeek: [...doc.daysOfWeek],
    status: doc.status,
    startsOn: doc.startsOn,
    endsOn: doc.endsOn,
    notes: doc.notes,
    items: doc.items.map(toRecurringOrderItem),
    skipDates: [...doc.skipDates],
    createdAt: timestampToIso(doc.createdAt),
  };
}

export function recurringOrderToDoc(order: Omit<RecurringOrder, "id">): RecurringOrderDoc {
  return {
    customerId: order.customerId,
    branchId: order.branchId,
    daysOfWeek: [...order.daysOfWeek],
    status: order.status,
    startsOn: order.startsOn,
    endsOn: order.endsOn,
    notes: order.notes,
    items: order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    skipDates: [...order.skipDates],
    createdAt: Timestamp.fromDate(new Date(order.createdAt)),
  };
}
