"use client";

import { useFormState, useWatch, type Control } from "react-hook-form";
import { Button } from "@/shared/components/atoms/Button/Button";
import { BottomBar } from "@/shared/components/organisms/BottomBar/BottomBar";
import type { Cents } from "@/shared/domain";
import { formatCents } from "@/shared/utils/money";
import { checkoutContent } from "../content/checkoutContent";
import type { CheckoutFormOutput, CheckoutFormValues } from "../lib/checkoutSchema";

const content = checkoutContent.bar;

export interface CheckoutBarProps {
  control: Control<CheckoutFormValues, unknown, CheckoutFormOutput>;
  totalCents: Cents;
  /** Placing, or placed and on the way to C7: the button says so and ignores taps. */
  pending: boolean;
}

/** The error summary, the total and Place order (the form's submit button). */
export function CheckoutBar({ control, totalCents, pending }: CheckoutBarProps) {
  const { errors } = useFormState({ control });
  const method = useWatch({ control, name: "paymentMethod" });
  const errorCount = Object.keys(errors).length;

  return (
    <BottomBar aria-label={content.label} className="flex flex-col gap-3">
      {errorCount > 0 && (
        <p role="alert" className="caption font-bold text-brick">
          {content.errorSummary(errorCount)}
        </p>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <span className="body-strong">{content.total}</span>
        <span aria-live="polite" className="price">
          {formatCents(totalCents)}
        </span>
      </div>
      {/* aria-disabled, not disabled: the button keeps focus while the order is placed. */}
      <Button type="submit" variant="primary" block aria-disabled={pending || undefined}>
        {pending ? content.placing : method === "online" ? content.continueToPayment : content.place}
      </Button>
    </BottomBar>
  );
}
