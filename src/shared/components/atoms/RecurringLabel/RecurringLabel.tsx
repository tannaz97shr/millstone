import { componentsContent } from "@/shared/content/components";
import { Stamp } from "../Stamp/Stamp";

export interface RecurringLabelProps {
  /** "Recurring" by default; the customer's list shows the days instead ("Tue, Thu, Sat"). */
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

/** Delft is used for nothing else but this label and focus. */
export function RecurringLabel({ children, title, className }: RecurringLabelProps) {
  return (
    <Stamp
      shape="tag"
      icon="repeat"
      plainCase
      toneClassName="bg-delft-soft text-delft border-delft"
      title={title}
      className={className}
    >
      {children ?? componentsContent.recurringLabel}
    </Stamp>
  );
}
