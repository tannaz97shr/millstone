import { cx } from "@/shared/utils/cx";

export interface FieldHintProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldHint({ id, className, children }: FieldHintProps) {
  return (
    <p id={id} className={cx("text-hint text-ink-muted", className)}>
      {children}
    </p>
  );
}
