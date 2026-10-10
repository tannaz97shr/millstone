"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Card } from "@/shared/components/atoms/Card/Card";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { CONTACT_LIMITS } from "@/modules/checkout/lib/checkoutSchema";
import { formatPhone } from "@/shared/utils/phone";
import { accountContent } from "../content/accountContent";
import { useFocusOnShow } from "../hooks/useFocusOnShow";
import { useProfileForm, type ProfileProblem } from "../hooks/useProfileForm";
import type { AccountProfile } from "../types/accountSession";

const content = accountContent.myAccount.details;

const problemText: Record<ProfileProblem, string> = {
  emailTaken: content.emailTaken,
  rateLimited: content.rateLimited,
  failed: content.failed,
};

/** C9 "Your details" (AccountArea.dc.html): the account's name, mobile and email, editable. */
export function ProfileSection({ profile }: { profile: AccountProfile }) {
  const { form, editing, startEditing, cancel, submit, problem, saved, dismissSaved, pending } =
    useProfileForm(profile);
  const { errors } = form.formState;
  const alertRef = useFocusOnShow<HTMLDivElement>(problem);
  const savedRef = useFocusOnShow<HTMLDivElement>(saved);

  return (
    <>
      {saved && (
        <div ref={savedRef} className="focus-visible:shadow-none">
          <Notice tone="success" onDismiss={dismissSaved}>
            {content.saved}
          </Notice>
        </div>
      )}
      <Card as="section" aria-labelledby="account-details-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="account-details-title" className="section-title">
            {content.title}
          </h2>
          {!editing && (
            <Button variant="secondary" onClick={startEditing} aria-label={content.editLabel}>
              {content.edit}
            </Button>
          )}
        </div>
        {!editing && (
          <dl className="flex flex-col gap-3">
            {(
              [
                [content.name, profile.name],
                [content.phone, formatPhone(profile.phone)],
                [content.email, profile.email],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="caption text-ink-muted">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {editing && (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!pending) void submit();
            }}
            className="flex flex-col gap-4"
          >
            {problem && (
              <div ref={alertRef} className="focus-visible:shadow-none">
                <Notice tone="error">{problemText[problem]}</Notice>
              </div>
            )}
            <div inert={pending} className="flex flex-col gap-4">
              <TextField
                label={content.name}
                autoComplete="name"
                maxLength={CONTACT_LIMITS.name}
                error={errors.name?.message}
                {...form.register("name")}
              />
              <TextField
                label={content.phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                error={errors.phone?.message}
                {...form.register("phone")}
              />
              <TextField
                label={content.email}
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                maxLength={CONTACT_LIMITS.email}
                error={errors.email?.message}
                {...form.register("email")}
              />
            </div>
            <p className="caption text-ink-muted">{content.note}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" aria-disabled={pending || undefined}>
                {pending ? content.saving : content.save}
              </Button>
              <Button variant="secondary" onClick={cancel} disabled={pending}>
                {content.cancel}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
