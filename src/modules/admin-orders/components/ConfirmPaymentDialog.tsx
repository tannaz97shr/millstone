"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { Dialog } from "@/shared/components/organisms/Dialog/Dialog";
import { formatCents } from "@/shared/utils/money";
import { adminOrdersContent } from "../content/adminOrdersContent";
import type { ActionTarget } from "../hooks/useOrderActions";

const content = adminOrdersContent.confirmPayment;

export interface ConfirmPaymentDialogProps {
  order: ActionTarget | null;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Collecting an unpaid order (AC-A7): has the customer paid? "Yes, paid ·
 * Collected" marks it paid and collected in one step, with no Undo after it.
 */
export function ConfirmPaymentDialog({ order, pending, onConfirm, onClose }: ConfirmPaymentDialogProps) {
  return (
    <Dialog
      open={order !== null}
      onClose={onClose}
      adminLayout="confirm"
      eyebrow={
        order && (
          <>
            <span className="admin-order-number tabular-nums">{order.orderNumber}</span>
            <PaymentLabel status="unpaid" />
          </>
        )
      }
      title={order ? content.title(order.contactName) : ""}
      description={
        order && (
          <>
            {content.body} <strong>{formatCents(order.totalCents)}</strong> {content.bodyEnd}
          </>
        )
      }
      actions={
        <>
          <Button
            variant="ready"
            counter
            icon="check"
            aria-disabled={pending || undefined}
            onClick={() => !pending && onConfirm()}
          >
            {content.yes}
          </Button>
          <Button variant="secondary" counter onClick={onClose}>
            {content.notYet}
          </Button>
        </>
      }
    />
  );
}
