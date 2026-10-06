"use client";

import { Controller, type Control } from "react-hook-form";
import { ChoiceGroup, type ChoiceOption } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import type { PaymentMethod } from "@/shared/domain";
import { checkoutContent } from "../content/checkoutContent";
import type { CheckoutFormOutput, CheckoutFormValues } from "../lib/checkoutSchema";

const content = checkoutContent.payment;

const ONLINE: ChoiceOption & { value: PaymentMethod } = {
  value: "online",
  label: content.online.label,
  hint: content.online.hint,
};
const AT_PICKUP: ChoiceOption & { value: PaymentMethod } = {
  value: "at_pickup",
  label: content.atPickup.label,
  hint: content.atPickup.hint,
};

export interface PaymentChoiceProps {
  control: Control<CheckoutFormValues, unknown, CheckoutFormOutput>;
  /** Off: only Pay at pickup, already chosen. */
  onlinePayments: boolean;
  /** Payments run on Stripe's test keys: say no real money moves, and which card to use. */
  testPayments: boolean;
}

/** "How would you like to pay?" (AC-C5). */
export function PaymentChoice({ control, onlinePayments, testPayments }: PaymentChoiceProps) {
  return (
    <section aria-label={content.regionLabel} className="flex flex-col gap-2">
      <Controller
        control={control}
        name="paymentMethod"
        render={({ field, fieldState }) => (
          <ChoiceGroup
            ref={field.ref}
            name={field.name}
            label={content.question}
            options={onlinePayments ? [ONLINE, AT_PICKUP] : [AT_PICKUP]}
            value={field.value || null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      {onlinePayments && testPayments && (
        <Notice tone="info" role="note" title={content.testNote.title}>
          {content.testNote.body}
        </Notice>
      )}
    </section>
  );
}
