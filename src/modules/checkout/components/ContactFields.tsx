"use client";

import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { checkoutContent } from "../content/checkoutContent";
import { CONTACT_LIMITS, type CheckoutFormOutput, type CheckoutFormValues } from "../lib/checkoutSchema";

const content = checkoutContent.details;

export interface ContactFieldsProps {
  form: UseFormReturn<CheckoutFormValues, unknown, CheckoutFormOutput>;
}

/** "Your details": name, mobile, email and optional notes (AC-C4). */
export function ContactFields({ form }: ContactFieldsProps) {
  const { register, formState } = form;
  const { errors } = formState;
  return (
    <section aria-labelledby="checkout-details-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="checkout-details-title" className="section-title">
          {content.title}
        </h2>
        <p className="caption text-ink-muted">{content.guestNote}</p>
      </div>
      <TextField
        label={content.name.label}
        autoComplete="name"
        maxLength={CONTACT_LIMITS.name}
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label={content.phone.label}
        hint={content.phone.hint}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <TextField
        label={content.email.label}
        hint={content.email.hint}
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        maxLength={CONTACT_LIMITS.email}
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label={content.notes.label}
        hint={content.notes.hint}
        optional
        multiline
        rows={2}
        maxLength={CONTACT_LIMITS.notes}
        error={errors.notes?.message}
        {...register("notes")}
      />
    </section>
  );
}
