import {
  PAYMENT_STATUSES,
  RECURRING_DISPLAY_STATUSES,
  VISIBLE_ORDER_STATUSES,
  type Weekday,
} from "@/shared/domain";
import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { RecurringStatusTag } from "@/shared/components/atoms/RecurringStatusTag/RecurringStatusTag";
import { StatusBadge } from "@/shared/components/atoms/StatusBadge/StatusBadge";
import { weekdayName } from "@/shared/utils/pickup-dates";
import { devComponentsContent } from "../../content/devComponents";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;

export interface LabelsSectionProps {
  recurringDays: Weekday[];
}

export function LabelsSection({ recurringDays }: LabelsSectionProps) {
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
      <Demo caption={content.captions.recurringDays}>
        <RecurringLabel>{recurringDays.map((day) => weekdayName(day)).join(", ")}</RecurringLabel>
      </Demo>
      <Demo caption={content.captions.recurringStatus}>
        {RECURRING_DISPLAY_STATUSES.map((status) => (
          <RecurringStatusTag key={status} status={status} />
        ))}
      </Demo>
    </PreviewSection>
  );
}
