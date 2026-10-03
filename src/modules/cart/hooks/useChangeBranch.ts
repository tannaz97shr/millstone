"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { branchKeys } from "@/modules/branches/api/queryKeys";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { menuQueryOptions } from "@/modules/menu/api/menuQueries";
import type { BranchMenu } from "@/modules/menu/types/menu";
import type { BranchId, IsoDate } from "@/shared/domain";
import { logError } from "@/shared/utils/logError";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import {
  moveCart,
  previewBranchChange,
  previewRemovesItems,
  reconcileCart,
  resolvePickupDate,
  type BranchChangePreview,
} from "../lib/cartLogic";
import { cartMessageScope, clearCartMessages, pushCartMessage } from "../lib/cartMessages";
import { getCartSnapshot, updateCart } from "../lib/cartStorage";
import { branchDateMovedMessage, removalMessages } from "../lib/removalMessages";
import type { CartRemovals } from "../types/cart";

export type ChangeBranchView = "closed" | "sheet" | "warning";

/** A branch picked in the sheet, checked against its menu for the day the cart would move to. */
export interface BranchChangeTarget {
  branch: BranchSummary;
  date: IsoDate;
  /** The cart's day, when the new branch can't take it. */
  movedFrom: IsoDate | null;
  menu: BranchMenu;
  preview: BranchChangePreview;
}

export interface ChangeBranchOptions {
  current: BranchSummary | undefined;
  branches: readonly BranchSummary[] | undefined;
  /** Called once the change is made; `told` when it left messages to read. */
  onChanged: (told: boolean) => void;
}

/**
 * C4's change-branch flow (AC-C2): the sheet, a check of the new branch's
 * menu for the day the cart would move to, and the warning when that would
 * take items out. Nothing changes until the customer confirms.
 */
export function useChangeBranch({ current, branches, onChanged }: ChangeBranchOptions) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ChangeBranchView>("closed");
  const [pending, setPending] = useState<BranchId | null>(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState<BranchChangeTarget | null>(null);
  // Bumped whenever the flow closes, so a menu that arrives late is ignored.
  const attempt = useRef(0);

  const pendingBranch = branches?.find((b) => b.id === pending) ?? current;

  const close = useCallback(() => {
    attempt.current += 1;
    setView("closed");
    setChecking(false);
    setFailed(false);
    setTarget(null);
  }, []);

  const open = useCallback(() => {
    if (!current) return;
    setPending(current.id);
    setFailed(false);
    setView("sheet");
  }, [current]);

  const choose = useCallback((branchId: string) => {
    setPending(branchId as BranchId);
    setFailed(false);
  }, []);

  const apply = useCallback(
    (next: BranchChangeTarget) => {
      const outcome: { removed: CartRemovals | null } = { removed: null };
      updateCart((cart) => {
        if (!cart) return cart;
        const moved = moveCart(cart, { branchId: next.branch.id, pickupDate: next.date });
        const result = reconcileCart(moved, next.menu);
        outcome.removed = result.removed;
        return result.cart;
      });

      clearCartMessages();
      const scope = cartMessageScope.cart(next.branch.id);
      const messages = [
        ...(next.movedFrom ? [branchDateMovedMessage(next.branch, next.movedFrom, next.date)] : []),
        ...(outcome.removed
          ? removalMessages(outcome.removed, next.branch.name, formatPickupDay(next.date))
          : []),
      ];
      for (const message of messages) pushCartMessage(scope, message);
      close();
      onChanged(messages.length > 0);
    },
    [close, onChanged],
  );

  /** The sheet's primary button. */
  const confirmSheet = useCallback(async () => {
    const cart = getCartSnapshot().cart;
    if (!current || !cart || !pendingBranch || checking) return;
    if (pendingBranch.id === current.id) {
      close();
      return;
    }

    const { date, movedFrom } = resolvePickupDate(null, cart.pickupDate, pendingBranch.pickup);
    const thisAttempt = ++attempt.current;
    setChecking(true);
    setFailed(false);
    let menu: BranchMenu;
    try {
      menu = await queryClient.fetchQuery(menuQueryOptions(pendingBranch.id, date));
    } catch (error) {
      logError(error, `useChangeBranch: ${pendingBranch.id} menu for ${date}`, { level: "warn" });
      if (thisAttempt !== attempt.current) return;
      setChecking(false);
      setFailed(true);
      // A day the server refused means the pickup calendar is out of date.
      void queryClient.invalidateQueries({ queryKey: branchKeys.list() });
      return;
    }
    if (thisAttempt !== attempt.current) return;
    setChecking(false);

    const latest = getCartSnapshot().cart ?? cart;
    const next: BranchChangeTarget = {
      branch: pendingBranch,
      date,
      movedFrom,
      menu,
      preview: previewBranchChange(latest, menu),
    };
    if (previewRemovesItems(next.preview)) {
      setTarget(next);
      setView("warning");
    } else {
      apply(next);
    }
  }, [current, pendingBranch, checking, queryClient, close, apply]);

  const confirmWarning = useCallback(() => {
    if (target) apply(target);
  }, [target, apply]);

  return {
    view,
    pendingBranch,
    checking,
    failed,
    target,
    open,
    choose,
    close,
    confirmSheet,
    confirmWarning,
  };
}
