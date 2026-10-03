import { cx } from "@/shared/utils/cx";

export interface EmptyStateProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  /** A button or link under the text, e.g. "Show all dates". */
  action?: React.ReactNode;
  /** Heading level of the title; h2 by default. */
  headingLevel?: "h1" | "h2";
  className?: string;
}

/**
 * Nothing to show here (A2 "No orders for this date"): a dashed box with a
 * title, a line of help and an optional next step. Admin sizes.
 */
export function EmptyState({ title, children, action, headingLevel = "h2", className }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={cx(
        "flex flex-col items-start gap-4 rounded-lg border-2 border-dashed border-line-strong bg-flour-raised px-12 py-10",
        className,
      )}
    >
      <Heading className="admin-title">{title}</Heading>
      {children && <div className="max-w-160 text-ink-muted">{children}</div>}
      {action}
    </div>
  );
}
