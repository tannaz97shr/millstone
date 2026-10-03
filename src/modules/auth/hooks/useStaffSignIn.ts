"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { postSignIn } from "../api/authApi";
import {
  signInFormSchema,
  type SignInFormOutput,
  type SignInFormValues,
} from "../lib/signInSchema";

/** What A1 says after a refused sign-in. */
export type SignInProblem = "invalid" | "locked" | "failed";

/**
 * A1's form and its submit. On success the browser loads the page it came
 * from with a full navigation, so the server sees the new session cookie.
 */
export function useStaffSignIn(returnTo: string | null) {
  const form = useForm<SignInFormValues, unknown, SignInFormOutput>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({ mutationFn: postSignIn, retry: false });
  const [problem, setProblem] = useState<SignInProblem | null>(null);

  const onValid = useCallback(
    async (values: SignInFormOutput) => {
      setProblem(null);
      try {
        const { redirectTo } = await mutation.mutateAsync({ ...values, returnTo: returnTo ?? undefined });
        window.location.assign(redirectTo);
      } catch (error) {
        const failure = toApiFailure(error);
        const expected = failure.code === "invalid_credentials" || failure.code === "too_many_attempts";
        logError(error, `useStaffSignIn: ${failure.code}`, { level: expected ? "warn" : "error" });
        setProblem(
          failure.code === "invalid_credentials" ? "invalid" : failure.code === "too_many_attempts" ? "locked" : "failed",
        );
        // The form focuses the message; the password is cleared for the next try.
        form.resetField("password");
      }
    },
    [form, mutation, returnTo],
  );

  // Fields left empty or malformed show their own errors; an old refusal goes away.
  const onInvalid = useCallback(() => setProblem(null), []);

  const submit = form.handleSubmit(onValid, onInvalid);

  // Stays true after success while the next page loads.
  const pending = mutation.isPending || mutation.isSuccess;

  return { form, submit, problem, pending };
}
