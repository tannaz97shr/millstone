import { componentsContent } from "@/shared/content/components";
import { cx } from "@/shared/utils/cx";

export interface FieldLabelProps {
  /** label for one input, legend for a fieldset, div for a labelled group. */
  as?: "label" | "legend" | "div";
  htmlFor?: string;
  id?: string;
  /** Adds "(optional)". Required is the default and isn't marked. */
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldLabel({
  as: Element = "label",
  htmlFor,
  id,
  optional = false,
  className,
  children,
}: FieldLabelProps) {
  return (
    <Element
      htmlFor={Element === "label" ? htmlFor : undefined}
      id={id}
      className={cx("p-0 text-label font-bold text-ink", className)}
    >
      {children}
      {optional && (
        <span className="font-normal text-ink-muted"> {componentsContent.field.optional}</span>
      )}
    </Element>
  );
}
