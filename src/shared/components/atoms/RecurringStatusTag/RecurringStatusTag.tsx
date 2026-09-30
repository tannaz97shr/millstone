import type { RecurringDisplayStatus } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import type { IconName } from "../Icon/Icon";
import { Stamp } from "../Stamp/Stamp";

export interface RecurringStatusTagProps {
  /** active: making orders. paused: none until resumed. ended: ends_on has passed (derived, not stored). */
  status: RecurringDisplayStatus;
  /** Overrides the word; keep it one word. */
  children?: React.ReactNode;
  className?: string;
}

// Neutral on purpose: no status colour, so it never reads as Ready, Paid or
// Cancelled. The word, icon and edge style carry the difference.
const styles: Record<RecurringDisplayStatus, { icon: IconName; tone: string }> = {
  active: { icon: "check", tone: "bg-flour-raised text-ink border-line-strong" },
  paused: { icon: "ring", tone: "bg-flour-raised text-ink border-line-strong border-dashed" },
  ended: { icon: "cross", tone: "bg-transparent text-ink-muted border-line" },
};

export function RecurringStatusTag({ status, children, className }: RecurringStatusTagProps) {
  const style = styles[status];
  return (
    <Stamp shape="tag" icon={style.icon} toneClassName={style.tone} className={className}>
      {children ?? componentsContent.recurringStatus[status]}
    </Stamp>
  );
}
