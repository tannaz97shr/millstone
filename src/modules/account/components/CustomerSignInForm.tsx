"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { routes } from "@/shared/routes";
import { accountContent } from "../content/accountContent";
import { useCustomerSignIn, type CustomerSignInProblem } from "../hooks/useCustomerSignIn";
import { useEmailHandoff } from "../hooks/useEmailHandoff";
import type { SignInPlace } from "../lib/signInContext";
import { useFocusOnShow } from "../hooks/useFocusOnShow";

const content = accountContent.signIn;

const problemText: Record<CustomerSignInProblem, string> = {
  invalid: content.invalid,
  locked: content.locked,
  rateLimited: content.rateLimited,
  failed: content.failed,
};

/** C8 sign in (Account.dc.html, SignInError.dc.html). */
export function CustomerSignInForm({ place }: { place: SignInPlace }) {
  const { form, submit, problem, pending } = useCustomerSignIn(place.returnTo);
  const { errors } = form.formState;
  const handOffEmail = useEmailHandoff(form);
  const alertRef = useFocusOnShow<HTMLDivElement>(problem);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="page-title">{content.title}</h1>
      <p>{content.intro[place.context]}</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) void submit();
        }}
        className="flex flex-col gap-5"
      >
        {problem && (
          <div ref={alertRef} className="focus-visible:shadow-none">
            <Notice tone="error">{problemText[problem]}</Notice>
          </div>
        )}
        <div inert={pending} className="flex flex-col gap-5">
          <TextField
            label={content.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            error={errors.email?.message}
            {...form.register("email")}
          />
          <div className="flex flex-col gap-1">
            <TextField
              label={content.password}
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...form.register("password")}
            />
            <ButtonLink href={routes.account.forgotPassword(place.returnTo)} variant="quiet" className="-ml-2 self-start">
              {content.forgot}
            </ButtonLink>
          </div>
        </div>
        <Button type="submit" variant="primary" block aria-disabled={pending || undefined}>
          {pending ? content.submitting : content.submit}
        </Button>
      </form>
      <hr className="border-line" />
      <div className="flex flex-col gap-3">
        <p className="body-strong">{content.newTitle}</p>
        <ButtonLink href={routes.account.signUp(place.returnTo)} variant="secondary" block onClick={handOffEmail}>
          {content.createAccount}
        </ButtonLink>
        <p className="caption text-ink-muted">{content.newNote}</p>
      </div>
      {place.context === "checkout" && (
        <ButtonLink href={place.backHref} variant="quiet" block>
          {content.continueAsGuest}
        </ButtonLink>
      )}
    </div>
  );
}
