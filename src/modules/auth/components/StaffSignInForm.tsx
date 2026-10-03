"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { focusWithoutTabStop } from "@/shared/utils/focusable";
import { signInContent as content } from "../content/signInContent";
import { useStaffSignIn, type SignInProblem } from "../hooks/useStaffSignIn";

const problemText: Record<SignInProblem, string> = {
  invalid: content.invalid,
  locked: content.locked,
  failed: content.failed,
};

export interface StaffSignInFormProps {
  /** Where to go afterwards; checked again on the server. */
  returnTo: string | null;
}

/** A1: C8's sign-in at admin size. Staff accounts are made by the owner, so there's no sign-up or reset here. */
export function StaffSignInForm({ returnTo }: StaffSignInFormProps) {
  const { form, submit, problem, pending } = useStaffSignIn(returnTo);
  const { register, formState } = form;
  const { errors } = formState;

  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (problem && alertRef.current) focusWithoutTabStop(alertRef.current);
  }, [problem]);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) void submit();
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <h1 className="admin-title">{content.title}</h1>
        <p>{content.intro}</p>
      </div>
      {problem && (
        <div ref={alertRef} className="focus-visible:shadow-none">
          <Notice tone="error">{problemText[problem]}</Notice>
        </div>
      )}
      <div inert={pending} className="flex flex-col gap-6">
        <TextField
          label={content.email.label}
          type="email"
          inputMode="email"
          autoComplete="username"
          spellCheck={false}
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label={content.password.label}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>
      <Button type="submit" variant="primary" block aria-disabled={pending || undefined}>
        {pending ? content.submitting : content.submit}
      </Button>
      <p className="admin-caption text-ink-muted">{content.forgotten}</p>
    </form>
  );
}
