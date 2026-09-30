"use client";

import { useId } from "react";
import { cx } from "@/shared/utils/cx";
import { FieldError } from "../../atoms/Field/FieldError";
import { FieldHint } from "../../atoms/Field/FieldHint";
import { FieldLabel } from "../../atoms/Field/FieldLabel";

type NativeInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "children">;

export interface TextFieldProps extends NativeInputProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  /** A sentence telling people how to fix it. */
  error?: React.ReactNode;
  /** Adds "(optional)". */
  optional?: boolean;
  /** Renders a textarea. */
  multiline?: boolean;
  /** Textarea only. */
  rows?: number;
  /** Forwarded to the input or textarea, so React Hook Form's register() works. */
  ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
}

const controlClasses =
  "w-full rounded-md border-(length:--control-border) bg-flour-raised px-4 text-control text-ink " +
  "placeholder:text-ink-muted focus:border-delft disabled:bg-flour-sunk disabled:text-ink-muted";

/** A labelled input or textarea: label above, then hint, the field, and the error. */
export function TextField({
  label,
  hint,
  error,
  optional = false,
  multiline = false,
  rows,
  id,
  type = "text",
  className,
  ref,
  "aria-describedby": describedByProp,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [describedByProp, hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  const shared = {
    id: fieldId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: cx(controlClasses, error ? "border-brick" : "border-line-strong"),
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <FieldLabel htmlFor={fieldId} optional={optional}>
        {label}
      </FieldLabel>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      {multiline ? (
        <textarea
          {...(rest as React.ComponentPropsWithoutRef<"textarea">)}
          {...shared}
          rows={rows}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={cx(shared.className, "min-h-[calc(var(--control-h)*2)] resize-y py-3")}
        />
      ) : (
        <input
          {...rest}
          {...shared}
          type={type}
          ref={ref as React.Ref<HTMLInputElement>}
          className={cx(shared.className, "min-h-control")}
        />
      )}
      <FieldError id={errorId} error={error} />
    </div>
  );
}
