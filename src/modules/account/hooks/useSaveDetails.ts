"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { orderKeys } from "@/modules/orders/api/queryKeys";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { postAccountFromOrder } from "../api/accountApi";
import { accountKeys } from "../api/queryKeys";
import { newPasswordField } from "../lib/accountSchemas";

const saveDetailsSchema = z.object({ password: newPasswordField });
type SaveDetailsValues = z.input<typeof saveDetailsSchema>;

/** What C7's offer says after a refusal. */
export type SaveDetailsProblem = "accountExists" | "unavailable" | "rateLimited" | "failed";

const PROBLEMS: Partial<Record<string, SaveDetailsProblem>> = {
  account_exists: "accountExists",
  already_linked: "unavailable",
  not_eligible: "unavailable",
  window_closed: "unavailable",
  not_found: "unavailable",
  rate_limited: "rateLimited",
};

/**
 * C7 "Save your details for next time" (AC-C10). On success the browser is
 * signed in: the session is asked for again (the header, the cart's owner)
 * and so is the order, which no longer offers an account. The page stays.
 */
export function useSaveDetails(orderId: string) {
  const queryClient = useQueryClient();
  const form = useForm<SaveDetailsValues>({
    resolver: zodResolver(saveDetailsSchema),
    defaultValues: { password: "" },
  });
  const mutation = useMutation({ mutationFn: postAccountFromOrder, retry: false });
  const [problem, setProblem] = useState<SaveDetailsProblem | null>(null);
  const [created, setCreated] = useState(false);

  const onValid = useCallback(
    async ({ password }: SaveDetailsValues) => {
      setProblem(null);
      try {
        await mutation.mutateAsync({ orderId, password });
        setCreated(true);
        form.reset();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: accountKeys.all }),
          queryClient.invalidateQueries({ queryKey: orderKeys.confirmation(orderId) }),
        ]);
      } catch (error) {
        const failure = toApiFailure(error);
        const expected = PROBLEMS[failure.code];
        logError(error, `useSaveDetails: ${failure.code}`, { level: expected ? "warn" : "error" });
        setProblem(expected ?? "failed");
      }
    },
    [form, mutation, orderId, queryClient],
  );

  const onInvalid = useCallback(() => setProblem(null), []);
  const submit = form.handleSubmit(onValid, onInvalid);
  return { form, submit, problem, created, pending: mutation.isPending };
}
