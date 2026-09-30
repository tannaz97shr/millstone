import { PAYMENT_STATUSES, VISIBLE_ORDER_STATUSES } from "@/shared/domain";
import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { StatusBadge } from "@/shared/components/atoms/StatusBadge/StatusBadge";
import { devComponentsContent } from "../../content/devComponents";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;

export function LabelsSection() {
  return (
    <PreviewSection id="labels" title={content.sections.labels}>
      <Demo caption={content.captions.orderStatus}>
        {VISIBLE_ORDER_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </Demo>
      <Demo caption={content.captions.payment}>
        {PAYMENT_STATUSES.map((status) => (
          <PaymentLabel key={status} status={status} />
        ))}
      </Demo>
      <Demo caption={content.captions.paymentCustomer}>
        <PaymentLabel status="unpaid">{content.labels.payAtPickup}</PaymentLabel>
      </Demo>
      <Demo caption={content.captions.recurring}>
        <RecurringLabel />
      </Demo>
    </PreviewSection>
  );
}
