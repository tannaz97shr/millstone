"use client";

import type { UseFormReturn } from "react-hook-form";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { routes } from "@/shared/routes";
import { checkoutContent } from "../content/checkoutContent";
import { CONTACT_LIMITS, type CheckoutFormOutput, type CheckoutFormValues } from "../lib/checkoutSchema";

const content = checkoutContent.details;

export interface ContactFieldsProps {
  form: UseFormReturn<CheckoutFormValues, unknown, CheckoutFormOutput>;
  /** Whether a confirmation email goes anywhere; the email hint promises one only then. */
  emailed: boolean;
  /** Signed in: the account's name for CheckoutSignedIn's note. Null for a guest. */
  accountName: string | null;
}

/**
 * "Your details": name, mobile, email and optional notes (AC-C4). A guest is
 * offered "Have an account? Sign in" (back here afterwards, with notes and
 * payment kept); signed in, the fields are filled in from the account.
 */
export function ContactFields({ form, emailed, accountName }: ContactFieldsProps) {
  const { register, formState } = form;
  const { errors } = formState;
  return (
    <section aria-labelledby="checkout-details-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="checkout-details-title" className="section-title">
          {content.title}
        </h2>
        {accountName !== null && <p className="caption text-ink-muted">{content.signedIn(accountName)}</p>}
      </div>
      {accountName === null && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 rounded-md bg-flour-sunk py-1 pr-1 pl-4">
            <span>{content.haveAccount}</span>
            <ButtonLink href={routes.account.signIn(routes.checkout)} variant="quiet">
              {content.signIn}
            </ButtonLink>
          </div>
          <p className="caption text-ink-muted">{content.guestNote}</p>
        </div>
      )}
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
        hint={emailed ? content.email.hint : content.email.hintNoEmail}
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
