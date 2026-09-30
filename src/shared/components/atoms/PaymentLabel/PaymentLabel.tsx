import type { PaymentStatus } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import type { IconName } from "../Icon/Icon";
import { Stamp } from "../Stamp/Stamp";

export interface PaymentLabelProps {
  status: PaymentStatus;
  /** Overrides the words, e.g. "Pay at pickup" on the customer site. */
  children?: React.ReactNode;
  className?: string;
}

// Loudness follows the work left: Unpaid > Paid > Refunded.
const styles: Record<PaymentStatus, { icon: IconName; tone: string }> = {
  unpaid: { icon: "note", tone: "bg-wheat text-ink border-ink" },
  paid: { icon: "check", tone: "bg-sage-soft text-sage border-sage" },
  refunded: {
    icon: "refund",
    tone: "bg-transparent text-ink-muted border-line-strong border-dashed",
  },
};

export function PaymentLabel({ status, children, className }: PaymentLabelProps) {
  const style = styles[status];
  return (
    <Stamp shape="tag" icon={style.icon} toneClassName={style.tone} className={className}>
      {children ?? componentsContent.paymentStatus[status]}
    </Stamp>
  );
}
