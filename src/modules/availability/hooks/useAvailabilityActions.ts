"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { StatusMessage } from "@/shared/components/molecules/StatusLine/StatusLine";
import type { AvailabilityState, BranchId, ProductId } from "@/shared/domain";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { postAvailabilityAction } from "../api/availabilityApi";
import { availabilityKeys } from "../api/queryKeys";
import { availabilityContent as content } from "../content/availabilityContent";
import type { AvailabilityActionRequest } from "../lib/availabilityActionSchema";
import { type AvailabilityChange, withProductState } from "../lib/availabilityRules";
import type { AvailabilityActionResult, AvailabilityProduct, BranchAvailability } from "../types/availability";

/** Where focus goes once an action is done, so a keyboard user never lands on <body>. */
export type AvailabilityFocusRequest =
  | { kind: "row-action"; productId: ProductId; action: "sold-out" | "back-on-sale" }
  | { kind: "status" };

export type AvailabilityMessage = StatusMessage;

const stateWords = (state: AvailabilityState) =>
  !state.isAvailable
    ? content.stateWords.off
    : state.soldOutOn
      ? content.stateWords.soldOut(formatPickupDay(state.soldOutOn))
      : content.stateWords.on;

function successText(
  product: AvailabilityProduct,
  change: AvailabilityChange,
  result: AvailabilityActionResult,
  branchName: string,
): AvailabilityMessage {
  const { name } = product;
  const lead =
    change.action === "switch_on"
      ? content.messages.switchedOn(name, branchName)
      : change.action === "switch_off"
        ? content.messages.switchedOff(name, branchName)
        : change.action === "mark_sold_out"
          ? content.messages.soldOut(name, formatPickupDay(change.date))
          : content.messages.backOnSale(name, product.state.soldOutOn && formatPickupDay(product.state.soldOutOn));

  if (result.affectedOrdersUnknown) return { tone: "warning", text: `${lead} ${content.messages.affectedUnknown}` };
  const affected = result.affectedOrders;
  if (!affected || affected.count === 0) return { tone: "success", text: lead };
  const extra =
    change.action === "mark_sold_out"
      ? content.messages.affectedOnDay(affected.count, affected.orderNumbers, formatPickupDay(change.date))
      : content.messages.affectedUpcoming(affected.count, affected.orderNumbers);
  return { tone: "warning", text: `${lead} ${extra}` };
}

interface UseAvailabilityActionsOptions {
  branchId: BranchId;
  branchName: string;
}

/**
 * Every A4 action: one request each, the cache patched with the server's
 * answer, then the branch refetched. Owns the message under the header and
 * where focus goes afterwards.
 */
export function useAvailabilityActions({ branchId, branchName }: UseAvailabilityActionsOptions) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ branch, action }: { branch: BranchId; action: AvailabilityActionRequest }) =>
      postAvailabilityAction(branch, action),
    retry: false,
  });

  const [pendingIds, setPendingIds] = useState<ReadonlySet<ProductId>>(new Set());
  const [message, setMessage] = useState<AvailabilityMessage | null>(null);
  const [focusRequest, setFocusRequest] = useState<AvailabilityFocusRequest | null>(null);

  const patchState = useCallback(
    (branch: BranchId, productId: ProductId, state: AvailabilityState) => {
      queryClient.setQueryData<BranchAvailability>(availabilityKeys.detail(branch), (data) =>
        data && { ...data, categories: withProductState(data.categories, productId, state) },
      );
    },
    [queryClient],
  );

  const run = useCallback(
    async (product: AvailabilityProduct, change: AvailabilityChange) => {
      if (pendingIds.has(product.id)) return;
      const branch = branchId;
      setPendingIds((ids) => new Set(ids).add(product.id));
      try {
        const result = await mutation.mutateAsync({
          branch,
          action: { ...change, productId: product.id, expected: product.state },
        });
        patchState(branch, product.id, result.state);
        setMessage(successText(product, change, result, branchName));
        if (change.action === "mark_sold_out") {
          setFocusRequest({ kind: "row-action", productId: product.id, action: "back-on-sale" });
        } else if (change.action === "back_on_sale") {
          setFocusRequest({ kind: "row-action", productId: product.id, action: "sold-out" });
        }
        // A Toggle keeps focus where it is.
      } catch (error) {
        logError(error, `availability ${change.action} ${branch}/${product.id}`, { level: "warn" });
        const failure = toApiFailure(error);
        if (failure.currentAvailability) patchState(branch, product.id, failure.currentAvailability);
        const text =
          (failure.code === "availability_changed" || failure.code === "not_allowed") && failure.currentAvailability
            ? content.messages.changed(product.name, stateWords(failure.currentAvailability))
            : failure.code === "not_found"
              ? content.messages.gone(product.name)
              : (failure.code === "past_cutoff" || failure.code === "closed_day" || failure.code === "out_of_range") &&
                  change.action === "mark_sold_out"
                ? content.messages.dayClosed(
                    formatPickupDay(change.date),
                    failure.earliest ? formatPickupDay(failure.earliest) : "",
                  )
                : failure.code === "unavailable"
                  ? content.messages.unavailable
                  : content.messages.failed;
        setMessage({ tone: "error", text });
        setFocusRequest({ kind: "status" });
      } finally {
        setPendingIds((ids) => {
          const next = new Set(ids);
          next.delete(product.id);
          return next;
        });
        void queryClient.invalidateQueries({ queryKey: availabilityKeys.detail(branch) });
      }
    },
    [branchId, branchName, mutation, patchState, pendingIds, queryClient],
  );

  const clearMessage = useCallback(() => setMessage(null), []);
  const focusHandled = useCallback(() => setFocusRequest(null), []);

  return { run, pendingIds, message, clearMessage, focusRequest, focusHandled };
}
