"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { postSignUp } from "../api/accountApi";
import { signUpFormSchema, type SignUpFormOutput, type SignUpFormValues } from "../lib/accountSchemas";

/** What C8's create-an-account says after a refusal. */
export type SignUpProblem = "emailTaken" | "rateLimited" | "failed";

const PROBLEMS: Partial<Record<string, SignUpProblem>> = {
  email_taken: "emailTaken",
  rate_limited: "rateLimited",
};

/**
 * C8 "Create an account" (AC-U1). The new account is signed in, and the
 * browser goes on to `returnTo` with a full navigation.
 */
export function useSignUp(returnTo: string) {
  const form = useForm<SignUpFormValues, unknown, SignUpFormOutput>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { name: "", phone: "", email: "", password: "" },
  });
  const mutation = useMutation({ mutationFn: postSignUp, retry: false });
  const [problem, setProblem] = useState<SignUpProblem | null>(null);

  const onValid = useCallback(
    async (values: SignUpFormOutput) => {
      setProblem(null);
      try {
        const { redirectTo } = await mutation.mutateAsync({ ...values, returnTo });
        window.location.assign(redirectTo);
      } catch (error) {
        const failure = toApiFailure(error);
        const expected = PROBLEMS[failure.code];
        logError(error, `useSignUp: ${failure.code}`, { level: expected ? "warn" : "error" });
        setProblem(expected ?? "failed");
      }
    },
    [mutation, returnTo],
  );

  const onInvalid = useCallback(() => setProblem(null), []);
  const submit = form.handleSubmit(onValid, onInvalid);
  const pending = mutation.isPending || mutation.isSuccess;
  return { form, submit, problem, pending };
}
