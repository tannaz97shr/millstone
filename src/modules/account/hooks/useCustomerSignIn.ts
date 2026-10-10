"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { postCustomerSignIn } from "../api/accountApi";
import {
  customerSignInFormSchema,
  type CustomerSignInFormOutput,
  type CustomerSignInFormValues,
} from "../lib/accountSchemas";

/** What C8 says after a refused sign-in. */
export type CustomerSignInProblem = "invalid" | "locked" | "rateLimited" | "failed";

const PROBLEMS: Partial<Record<string, CustomerSignInProblem>> = {
  invalid_credentials: "invalid",
  too_many_attempts: "locked",
  rate_limited: "rateLimited",
};

/**
 * C8's sign-in form and its submit. On success the browser loads the page it
 * came from with a full navigation, so the server sees the new session
 * cookie and the cart moves to the account.
 */
export function useCustomerSignIn(returnTo: string) {
  const form = useForm<CustomerSignInFormValues, unknown, CustomerSignInFormOutput>({
    resolver: zodResolver(customerSignInFormSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({ mutationFn: postCustomerSignIn, retry: false });
  const [problem, setProblem] = useState<CustomerSignInProblem | null>(null);

  const onValid = useCallback(
    async (values: CustomerSignInFormOutput) => {
      setProblem(null);
      try {
        const { redirectTo } = await mutation.mutateAsync({ ...values, returnTo });
        window.location.assign(redirectTo);
      } catch (error) {
        const failure = toApiFailure(error);
        const expected = PROBLEMS[failure.code];
        logError(error, `useCustomerSignIn: ${failure.code}`, { level: expected ? "warn" : "error" });
        setProblem(expected ?? "failed");
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
