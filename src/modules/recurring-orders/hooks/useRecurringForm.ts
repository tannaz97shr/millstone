"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import type { IsoDate } from "@/shared/domain";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";
import { focusWithoutTabStop } from "@/shared/utils/focusable";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { logError } from "@/shared/utils/logError";
import { fetchRecurringOrder, patchRecurringOrder, postRecurringOrder } from "../api/recurringApi";
import { recurringKeys } from "../api/queryKeys";
import { recurringContent } from "../content/recurringContent";
import { setRecurringFlash } from "../lib/recurringFlash";
import {
  FORM_FIELD_ORDER,
  formValuesFromDetail,
  recurringFormSchema,
  toCreateRequest,
  toUpdateRequest,
  type RecurringFormOutput,
  type RecurringFormValues,
} from "../lib/recurringForm";
import { recurringProblem, type RecurringProblem } from "../lib/recurringProblems";
import type { RecurringBranchView, RecurringOrderDetail } from "../types/recurringOrderView";
import { useRecurringWriteDone } from "./useRecurringWriteDone";

const flash = recurringContent.detail.flash;

/** The id of the section that holds each field, for focusing the first one to fix. */
export const sectionIdOf = (field: (typeof FORM_FIELD_ORDER)[number]) => `recurring-form-${field}`;

export interface UseRecurringFormInput {
  defaultValues: RecurringFormValues;
  /** Editing: the order as C11 read it. Creating: null. */
  detail: RecurringOrderDetail | null;
}

/** What the form shows when it's sent, which depends on the branch chosen. */
export interface SubmitContext {
  /** The branch the form is for (null until one is chosen), to word a refusal. */
  branch: Pick<RecurringBranchView, "name" | "phone" | "closedDays"> | null;
  /** The products in the order the form lists them. */
  productOrder: readonly string[];
}

/**
 * C11 create and edit (AC-R2, R4). A valid form goes to the API; a refusal is
 * said at the top of the form and focused. A version clash reloads the order
 * into the form, so the customer sees what changed before saving again. A
 * save opens C12, which says what happened.
 */
export function useRecurringForm({ defaultValues, detail }: UseRecurringFormInput) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const writeDone = useRecurringWriteDone();
  const [problem, setProblem] = useState<(RecurringProblem & { key: number }) | null>(null);
  /** A later earliest start the server named (start_too_early). */
  const [earliestOverride, setEarliestOverride] = useState<IsoDate | null>(null);
  const form = useForm<RecurringFormValues, unknown, RecurringFormOutput>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues,
  });
  const mutation = useMutation({
    mutationFn: ({ values, productOrder }: { values: RecurringFormOutput; productOrder: readonly string[] }) =>
      detail
        ? patchRecurringOrder(detail.id, toUpdateRequest(values, productOrder, detail.version))
        : postRecurringOrder(toCreateRequest(values, productOrder)),
    retry: false,
  });

  const onValid = useCallback(
    async (values: RecurringFormOutput, { branch, productOrder }: SubmitContext) => {
      setProblem(null);
      try {
        const saved = await mutation.mutateAsync({ values, productOrder });
        writeDone(saved);
        const first = saved.firstNewPickup ? formatPickupDay(saved.firstNewPickup) : null;
        setRecurringFlash(saved.id, detail ? flash.saved(first) : flash.created(first));
        router.push(routes.account.recurring.detail(saved.id));
      } catch (error) {
        const failure = toApiFailure(error);
        const found = recurringProblem(failure, {
          branch: branch ?? { name: "", phone: "", closedDays: [] },
          paused: detail?.status === "paused",
        });
        logError(error, `useRecurringForm ${detail ? "edit" : "create"}: ${failure.code}`, {
          level: found.expected ? "warn" : "error",
        });
        setProblem((prev) => ({ ...found, key: (prev?.key ?? 0) + 1 }));
        if (failure.code === "start_too_early" && failure.earliest) {
          setEarliestOverride(failure.earliest);
          form.setValue("startsOn", failure.earliest);
        }
        if (detail && found.refetch) {
          try {
            const fresh = await queryClient.fetchQuery({
              queryKey: recurringKeys.detail(detail.id),
              queryFn: () => fetchRecurringOrder(detail.id),
              staleTime: 0,
            });
            if (failure.code === "recurring_changed") form.reset(formValuesFromDetail(fresh));
          } catch (refetchError) {
            logError(refetchError, "useRecurringForm: reload after a refusal", { level: "warn" });
          }
        }
      }
    },
    [detail, form, mutation, queryClient, router, writeDone],
  );

  // The first section with something to fix takes focus; the footer says how many.
  const onInvalid = useCallback((errors: FieldErrors<RecurringFormValues>) => {
    setProblem(null);
    const first = FORM_FIELD_ORDER.find((field) => errors[field]);
    const section = first ? document.getElementById(sectionIdOf(first)) : null;
    if (section) focusWithoutTabStop(section);
  }, []);

  return {
    form,
    submit: (context: SubmitContext) => form.handleSubmit((values) => onValid(values, context), onInvalid)(),
    problem,
    earliestOverride,
    pending: mutation.isPending || mutation.isSuccess,
  };
}
