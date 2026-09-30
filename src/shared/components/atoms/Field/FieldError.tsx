import { cx } from "@/shared/utils/cx";
import { Icon } from "../Icon/Icon";

export interface FieldErrorProps {
  /** Referenced by the field's aria-describedby while there is an error. */
  id: string;
  /** A sentence that says how to fix it. Nothing renders without one. */
  error?: React.ReactNode;
  className?: string;
}

/**
 * The live region stays mounted even without an error, so a message that
 * appears after submit is announced. Empty, it's taken out of the flow (not
 * display:none, which would stop the announcement) so it adds no gap.
 */
export function FieldError({ id, error, className }: FieldErrorProps) {
  return (
    <div aria-live="polite" className={cx("empty:absolute", className)}>
      {error && (
        <p id={id} className="flex items-start gap-1 text-hint font-bold text-brick">
          <Icon name="alert" className="mt-[0.15em]" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
