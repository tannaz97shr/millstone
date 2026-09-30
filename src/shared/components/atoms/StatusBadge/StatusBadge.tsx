import type { VisibleOrderStatus } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import type { IconName } from "../Icon/Icon";
import { Stamp } from "../Stamp/Stamp";

export interface StatusBadgeProps {
  status: VisibleOrderStatus;
  /** Overrides the word; keep it one word. */
  children?: React.ReactNode;
  className?: string;
}

// Ready is the only solid fill. Placed and Ready differ in lightness, icon and word.
const styles: Record<VisibleOrderStatus, { icon: IconName; tone: string }> = {
  placed: { icon: "ring", tone: "bg-wheat-soft text-wheat-ink border-wheat" },
  ready: { icon: "check", tone: "bg-sage text-on-sage border-sage" },
  collected: { icon: "check", tone: "bg-flour-sunk text-ink-muted border-line" },
  cancelled: { icon: "cross", tone: "bg-brick-soft text-brick border-brick border-dashed" },
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const style = styles[status];
  return (
    <Stamp shape="pill" icon={style.icon} toneClassName={style.tone} className={className}>
      {children ?? componentsContent.orderStatus[status]}
    </Stamp>
  );
}
