import "server-only";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  BranchId,
  CustomerId,
  IsoInstant,
  Order,
  OrderId,
  OrderItem,
  ProductId,
  RecurringOrderId,
} from "@/shared/domain";
import { optionalTimestampToIso, timestampToIso } from "@/shared/lib/firebase/fieldSchemas";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { OrderDoc, OrderItemDoc } from "../types/orderDocs";
import { orderDocSchema } from "./orderSchema";

function toOrderItem(item: OrderItemDoc): OrderItem {
  return {
    productId: item.productId as ProductId,
    productName: item.productName,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    lineTotalCents: item.lineTotalCents,
  };
}

export function toOrder(snapshot: DocumentSnapshot): Order {
  const doc = parseDoc(orderDocSchema, snapshot);
  return {
    id: snapshot.id as OrderId,
    orderNumber: doc.orderNumber,
    branchId: doc.branchId as BranchId,
    customerId: doc.customerId as CustomerId | null,
    contactName: doc.contactName,
    contactPhone: doc.contactPhone,
    contactEmail: doc.contactEmail,
    pickupDate: doc.pickupDate,
    status: doc.status,
    notes: doc.notes,
    items: doc.items.map(toOrderItem),
    totalCents: doc.totalCents,
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    paymentRef: doc.paymentRef,
    processedStripeEventIds: [...doc.processedStripeEventIds],
    recurringOrderId: doc.recurringOrderId as RecurringOrderId | null,
    generationNote: doc.generationNote,
    cancellationReason: doc.cancellationReason,
    createdAt: timestampToIso(doc.createdAt),
    paidAt: optionalTimestampToIso(doc.paidAt),
    refundedAt: optionalTimestampToIso(doc.refundedAt),
    readyAt: optionalTimestampToIso(doc.readyAt),
    collectedAt: optionalTimestampToIso(doc.collectedAt),
    cancelledAt: optionalTimestampToIso(doc.cancelledAt),
  };
}

const toTimestamp = (iso: IsoInstant) => Timestamp.fromDate(new Date(iso));
const toOptionalTimestamp = (iso: IsoInstant | null) => (iso ? toTimestamp(iso) : null);

function orderItemToDoc(item: OrderItem): OrderItemDoc {
  return {
    productId: item.productId,
    productName: item.productName,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    lineTotalCents: item.lineTotalCents,
  };
}

export function orderToDoc(order: Omit<Order, "id">): OrderDoc {
  return {
    orderNumber: order.orderNumber,
    branchId: order.branchId,
    customerId: order.customerId,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    contactEmail: order.contactEmail,
    pickupDate: order.pickupDate,
    status: order.status,
    notes: order.notes,
    items: order.items.map(orderItemToDoc),
    totalCents: order.totalCents,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentRef: order.paymentRef,
    processedStripeEventIds: [...order.processedStripeEventIds],
    recurringOrderId: order.recurringOrderId,
    generationNote: order.generationNote,
    cancellationReason: order.cancellationReason,
    createdAt: toTimestamp(order.createdAt),
    paidAt: toOptionalTimestamp(order.paidAt),
    refundedAt: toOptionalTimestamp(order.refundedAt),
    readyAt: toOptionalTimestamp(order.readyAt),
    collectedAt: toOptionalTimestamp(order.collectedAt),
    cancelledAt: toOptionalTimestamp(order.cancelledAt),
  };
}
