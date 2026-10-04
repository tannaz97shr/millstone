import type { IsoInstant, Order, VisibleOrderStatus } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { type OrderAction, UNDO_SERVER_WINDOW_MS } from "./orderActionSchema";

// What a staff action does to an order (spec 7, AC-A6 to A10), worked out
// from the order as stored now. Pure: the transaction in applyOrderAction
// reads the order, asks this, and writes exactly the fields returned.

export type VisibleOrder = Order & { status: VisibleOrderStatus };

/** The fields an action writes. Nothing else on the order changes. */
export type OrderChanges = Partial<
  Pick<
    Order,
    | "status"
    | "paymentStatus"
    | "paidAt"
    | "readyAt"
    | "collectedAt"
    | "cancelledAt"
    | "refundedAt"
    | "cancellationReason"
    | "cancellationNote"
    | "collectUndo"
  >
>;

export interface OrderPlan {
  changes: OrderChanges;
  /** Set after a one-tap Collected: the last moment Undo is accepted. */
  undoUntil: IsoInstant | null;
}

const changed = (order: VisibleOrder) =>
  new ApiError(409, "order_changed", `${order.orderNumber} is now ${order.status}`, {
    orderNumber: order.orderNumber,
    currentStatus: order.status,
  });

const notAllowed = (order: VisibleOrder, what: string) =>
  new ApiError(409, "not_allowed", `${order.orderNumber} is ${order.status}: can't ${what}`, {
    orderNumber: order.orderNumber,
    currentStatus: order.status,
  });

function assertExpected(order: VisibleOrder, expected: VisibleOrderStatus): void {
  if (order.status !== expected) throw changed(order);
}

const isOpen = (status: VisibleOrderStatus): status is "placed" | "ready" =>
  status === "placed" || status === "ready";

export function planOrderAction(order: VisibleOrder, action: OrderAction, now: Date): OrderPlan {
  const at = now.toISOString() as IsoInstant;

  switch (action.action) {
    case "ready": {
      assertExpected(order, action.expectedStatus);
      if (order.status !== "placed") throw notAllowed(order, "mark ready");
      return { changes: { status: "ready", readyAt: at }, undoUntil: null };
    }

    case "collect": {
      assertExpected(order, action.expectedStatus);
      if (!isOpen(order.status)) throw notAllowed(order, "collect");
      if (order.paymentStatus === "paid") {
        const until = new Date(now.getTime() + UNDO_SERVER_WINDOW_MS).toISOString() as IsoInstant;
        return {
          changes: {
            status: "collected",
            collectedAt: at,
            collectUndo: { previousStatus: order.status, until },
          },
          undoUntil: until,
        };
      }
      if (order.paymentStatus === "unpaid" && action.paymentConfirmed) {
        // Paid and collected in one write; no Undo after it (AC-A7).
        return {
          changes: { status: "collected", collectedAt: at, paymentStatus: "paid", paidAt: at, collectUndo: null },
          undoUntil: null,
        };
      }
      if (order.paymentStatus === "unpaid") {
        throw new ApiError(409, "payment_unconfirmed", `${order.orderNumber} is unpaid: confirm payment first`, {
          orderNumber: order.orderNumber,
          currentStatus: order.status,
        });
      }
      // Refunded only ever follows a cancel, so an open order can't get here.
      throw notAllowed(order, "collect a refunded order");
    }

    case "undo_collect": {
      if (order.status !== "collected") throw changed(order);
      const undo = order.collectUndo;
      if (!undo || now.getTime() > new Date(undo.until).getTime()) {
        throw new ApiError(409, "undo_expired", `Too late to undo ${order.orderNumber}`, {
          orderNumber: order.orderNumber,
          currentStatus: order.status,
        });
      }
      // readyAt stays: it's still true that the order was made ready.
      return {
        changes: { status: undo.previousStatus, collectedAt: null, collectUndo: null },
        undoUntil: null,
      };
    }

    case "cancel": {
      assertExpected(order, action.expectedStatus);
      if (!isOpen(order.status)) throw notAllowed(order, "cancel");
      if (action.reason === "other" && !action.note) {
        throw new ApiError(400, "invalid_body", '"other" needs a note', { fields: ["note"] });
      }
      return {
        changes: {
          status: "cancelled",
          cancelledAt: at,
          cancellationReason: action.reason,
          cancellationNote: action.reason === "other" ? (action.note as string) : null,
          collectUndo: null,
        },
        undoUntil: null,
      };
    }

    case "mark_refunded": {
      if (order.status === "cancelled" && order.paymentStatus === "refunded") throw changed(order);
      if (order.status !== "cancelled" || order.paymentMethod !== "online" || order.paymentStatus !== "paid") {
        throw notAllowed(order, "mark refunded");
      }
      return { changes: { paymentStatus: "refunded", refundedAt: at }, undoUntil: null };
    }
  }
}

/** The order as it will be once the changes are written. */
export function applyChanges(order: VisibleOrder, changes: OrderChanges): VisibleOrder {
  return { ...order, ...changes } as VisibleOrder;
}
