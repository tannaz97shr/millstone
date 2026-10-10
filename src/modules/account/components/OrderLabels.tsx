import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { StatusBadge } from "@/shared/components/atoms/StatusBadge/StatusBadge";
import { accountContent } from "../content/accountContent";
import type { AccountOrder } from "../types/accountOrder";

const words = accountContent.order;

/**
 * An order's status, payment and Recurring labels (AccountArea.dc.html). A
 * cancelled order that was never paid has no payment label, as in the admin
 * (AC-A2): there's nothing to pay.
 */
export function OrderLabels({ order }: { order: AccountOrder }) {
  const showPayment = !(order.status === "cancelled" && order.paymentStatus === "unpaid");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={order.status} />
      {showPayment && (
        <PaymentLabel status={order.paymentStatus}>
          {order.paymentStatus === "paid"
            ? words.paid.label
            : order.paymentStatus === "refunded"
              ? words.refunded.label
              : words.unpaid.label}
        </PaymentLabel>
      )}
      {order.recurring && <RecurringLabel />}
    </div>
  );
}
