"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { CONTACT_LIMITS } from "@/modules/checkout/lib/checkoutSchema";
import { routes } from "@/shared/routes";
import { accountContent } from "../content/accountContent";
import { useSignUp, type SignUpProblem } from "../hooks/useSignUp";
import { PASSWORD_LIMITS } from "../lib/accountSchemas";
import type { SignInPlace } from "../lib/signInContext";
import { useFocusOnShow } from "../hooks/useFocusOnShow";

const content = accountContent.signUp;

const problemText: Record<SignUpProblem, string> = {
  emailTaken: content.emailTaken,
  rateLimited: content.rateLimited,
  failed: content.failed,
};

/** C8 create an account (SignUp.dc.html, SignUpErrors.dc.html; AC-U1). */
export function SignUpForm({ place }: { place: SignInPlace }) {
  const { form, submit, problem, pending } = useSignUp(place.returnTo);
  const { errors } = form.formState;
  const alertRef = useFocusOnShow<HTMLDivElement>(problem);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="page-title">{content.title}</h1>
      <p>{content.intro}</p>
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
            <Notice
              tone="error"
              action={
                problem === "emailTaken" ? (
                  <ButtonLink href={routes.account.signIn(place.returnTo)} variant="quiet">
                    {content.emailTakenAction}
                  </ButtonLink>
                ) : undefined
              }
            >
              {problemText[problem]}
            </Notice>
          </div>
        )}
        <div inert={pending} className="flex flex-col gap-5">
          <TextField
            label={content.name}
            autoComplete="name"
            maxLength={CONTACT_LIMITS.name}
            error={errors.name?.message}
            {...form.register("name")}
          />
          <TextField
            label={content.phone.label}
            hint={content.phone.hint}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...form.register("phone")}
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
            {...form.register("email")}
          />
          <TextField
            label={content.password.label}
            hint={content.password.hint}
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_LIMITS.max}
            error={errors.password?.message}
            {...form.register("password")}
          />
        </div>
        <Button type="submit" variant="primary" block aria-disabled={pending || undefined}>
          {pending ? content.submitting : content.submit}
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-1">
        <span>{content.haveAccount}</span>
        <ButtonLink href={routes.account.signIn(place.returnTo)} variant="quiet">
          {content.signIn}
        </ButtonLink>
      </div>
    </div>
  );
}
