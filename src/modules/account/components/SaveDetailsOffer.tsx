"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Card } from "@/shared/components/atoms/Card/Card";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { accountContent } from "../content/accountContent";
import { useFocusOnShow } from "../hooks/useFocusOnShow";
import { useSaveDetails, type SaveDetailsProblem } from "../hooks/useSaveDetails";
import { PASSWORD_LIMITS } from "../lib/accountSchemas";

const content = accountContent.saveDetails;

const problemText: Record<SaveDetailsProblem, string> = {
  unavailable: content.unavailable,
  rateLimited: content.rateLimited,
  failed: content.failed,
};

export interface SaveDetailsOfferProps {
  orderId: string;
  email: string;
  /** The server's accountOffer for this viewer. */
  offered: boolean;
}

/**
 * C7's "Save your details for next time" for a guest (Confirmation.dc.html),
 * then "Your account is set up" (ConfAccountCreated.dc.html). Stays mounted
 * so the success message outlives the offer, which the order stops making
 * once it's saved.
 */
export function SaveDetailsOffer({ orderId, email, offered }: SaveDetailsOfferProps) {
  const { form, submit, problem, created, pending } = useSaveDetails(orderId);
  const alertRef = useFocusOnShow<HTMLDivElement>(problem);
  const createdRef = useFocusOnShow<HTMLDivElement>(created);

  if (created) {
    return (
      <div ref={createdRef} className="focus-visible:shadow-none">
        <Notice tone="neutral" icon="check" title={content.createdTitle}>
          {content.created(email)}
        </Notice>
      </div>
    );
  }
  if (!offered) return null;

  return (
    <Card as="section" aria-labelledby="save-details-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="save-details-title" className="section-title">
          {content.title}
        </h2>
        <p>{content.body}</p>
      </div>
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
        {/* For password managers: the account's email goes with the new password. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <TextField
          label={content.password}
          hint={content.passwordHint(email)}
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_LIMITS.max}
          inert={pending}
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" variant="primary" block aria-disabled={pending || undefined}>
          {pending ? content.submitting : content.submit}
        </Button>
      </form>
    </Card>
  );
}
