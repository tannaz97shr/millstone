"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { formatPhone } from "@/shared/utils/phone";
import { logError } from "@/shared/utils/logError";
import { patchProfile } from "../api/accountApi";
import { accountKeys } from "../api/queryKeys";
import { profileFormSchema, type ProfileFormOutput, type ProfileFormValues } from "../lib/accountSchemas";
import type { AccountProfile, AccountSessionResponse } from "../types/accountSession";

/** What C9's details form says after a refusal. */
export type ProfileProblem = "emailTaken" | "rateLimited" | "failed";

const PROBLEMS: Partial<Record<string, ProfileProblem>> = {
  email_taken: "emailTaken",
  rate_limited: "rateLimited",
};

const toValues = (profile: AccountProfile): ProfileFormValues => ({
  name: profile.name,
  phone: formatPhone(profile.phone),
  email: profile.email,
});

/**
 * C9 "Your details": view, Edit, Save details or Cancel. A save updates the
 * session everywhere at once (checkout's prefill, the header), and C9 says
 * "Details saved" until dismissed or the next edit.
 */
export function useProfileForm(profile: AccountProfile) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState<ProfileProblem | null>(null);
  const form = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toValues(profile),
  });
  const mutation = useMutation({ mutationFn: patchProfile, retry: false });

  const startEditing = useCallback(() => {
    form.reset(toValues(profile));
    setProblem(null);
    setSaved(false);
    setEditing(true);
  }, [form, profile]);

  const cancel = useCallback(() => {
    setProblem(null);
    setEditing(false);
  }, []);

  const onValid = useCallback(
    async (values: ProfileFormOutput) => {
      setProblem(null);
      try {
        const next = await mutation.mutateAsync(values);
        queryClient.setQueryData<AccountSessionResponse>(accountKeys.session(), { customer: next });
        setEditing(false);
        setSaved(true);
      } catch (error) {
        const failure = toApiFailure(error);
        const expected = PROBLEMS[failure.code];
        logError(error, `useProfileForm: ${failure.code}`, { level: expected ? "warn" : "error" });
        setProblem(expected ?? "failed");
        if (expected === "emailTaken") form.setFocus("email");
      }
    },
    [form, mutation, queryClient],
  );

  const onInvalid = useCallback(() => setProblem(null), []);
  const submit = form.handleSubmit(onValid, onInvalid);

  return {
    form,
    editing,
    startEditing,
    cancel,
    submit,
    problem,
    saved,
    dismissSaved: () => setSaved(false),
    pending: mutation.isPending,
  };
}
