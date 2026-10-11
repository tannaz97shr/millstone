"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { IsoDate } from "@/shared/domain";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { logError } from "@/shared/utils/logError";
import { postRecurringAction, type RecurringActionInput } from "../api/recurringApi";
import { recurringKeys } from "../api/queryKeys";
import { recurringContent } from "../content/recurringContent";
import { recurringProblem, type RecurringProblem } from "../lib/recurringProblems";
import type { RecurringOrderDetail } from "../types/recurringOrderView";
import { useRecurringWriteDone } from "./useRecurringWriteDone";

const flash = recurringContent.detail.flash;

export type RecurringAction = RecurringActionInput["action"];

/** After a skip or undo: the row, and the button it should show once the new detail is on screen. */
export interface FocusTarget {
  date: IsoDate;
  kind: "skipped" | "open";
}

/** A message at the top of C12, keyed so the same words said twice are announced (and focused) twice. */
export interface Flash {
  message: string;
  key: number;
}

/**
 * C12's actions (AC-R5 to R7). Each sends the version C12 read. Afterwards:
 * pause, resume and end say so at the top; skip and undo change their row in
 * place (as designed) and move focus to the row's other button. A refusal is
 * said at the top, and C12 reloads when the order changed under it.
 */
export function useRecurringActions(detail: RecurringOrderDetail, initialFlash: string | null) {
  const queryClient = useQueryClient();
  const writeDone = useRecurringWriteDone();
  const [flashState, setFlashState] = useState<Flash | null>(
    initialFlash ? { message: initialFlash, key: 0 } : null,
  );
  const [problem, setProblem] = useState<(RecurringProblem & { key: number }) | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const mutation = useMutation({
    mutationFn: (request: RecurringActionInput) => postRecurringAction(detail.id, request),
    retry: false,
  });

  const say = useCallback((message: string) => setFlashState((prev) => ({ message, key: (prev?.key ?? 0) + 1 })), []);

  const run = useCallback(
    async (request: RecurringActionInput, after: (next: RecurringOrderDetail) => void): Promise<boolean> => {
      setProblem(null);
      try {
        const next = await mutation.mutateAsync(request);
        writeDone(next);
        after(next);
        return true;
      } catch (error) {
        const failure = toApiFailure(error);
        const date = "date" in request ? (request.date as IsoDate) : null;
        const found = recurringProblem(failure, { branch: detail.branch, date, paused: detail.status === "paused" });
        logError(error, `useRecurringActions ${request.action}: ${failure.code}`, {
          level: found.expected ? "warn" : "error",
        });
        setFlashState(null);
        setProblem((prev) => ({ ...found, key: (prev?.key ?? 0) + 1 }));
        if (found.refetch) void queryClient.invalidateQueries({ queryKey: recurringKeys.detail(detail.id) });
        return false;
      }
    },
    [detail.branch, detail.id, detail.status, mutation, queryClient, writeDone],
  );

  const base = { expectedVersion: detail.version };

  return {
    flash: flashState,
    dismissFlash: () => setFlashState(null),
    problem,
    /** The row whose button should take focus once the new detail is on screen. */
    focusTarget,
    focusDone: () => setFocusTarget(null),
    pending: mutation.isPending ? (mutation.variables?.action ?? null) : null,
    pendingDate:
      mutation.isPending && mutation.variables && "date" in mutation.variables
        ? (mutation.variables.date as IsoDate)
        : null,

    pause: () => run({ action: "pause", ...base }, () => say(flash.paused)),
    resume: () =>
      run({ action: "resume", ...base }, (next) =>
        say(flash.resumed(next.firstNewPickup ? formatPickupDay(next.firstNewPickup) : null)),
      ),
    skip: (date: IsoDate) =>
      run({ action: "skip", date, ...base }, () => {
        setFlashState(null);
        setFocusTarget({ date, kind: "skipped" });
      }),
    unskip: (date: IsoDate) =>
      run({ action: "unskip", date, ...base }, () => {
        setFlashState(null);
        setFocusTarget({ date, kind: "open" });
      }),
    endNow: () => run({ action: "end_now", ...base }, () => say(flash.ended)),
    endAfter: (date: IsoDate) =>
      run({ action: "end_after", date, ...base }, () => say(flash.endsAfter(formatPickupDay(date)))),
  };
}
