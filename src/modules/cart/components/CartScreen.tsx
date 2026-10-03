"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { MenuProduct } from "@/modules/menu/types/menu";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import type { ProductId } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { focusWithoutTabStop } from "@/shared/utils/focusable";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { cartContent } from "../content/cartContent";
import { useCartPage } from "../hooks/useCartPage";
import { useChangeBranch } from "../hooks/useChangeBranch";
import { cartCount } from "../lib/cartLogic";
import { BranchChangeWarning } from "./BranchChangeWarning";
import { CartEmptyState } from "./CartEmptyState";
import { CartLines } from "./CartLines";
import { CartPickupCard } from "./CartPickupCard";
import { CartTotalBar } from "./CartTotalBar";
import { ChangeBranchSheet } from "./ChangeBranchSheet";

const content = cartContent.page;

/** Where focus goes after the next render, when what had it is about to disappear. */
type FocusRequest = { kind: "line"; id: ProductId } | { kind: "empty" } | { kind: "notices" };

/**
 * C4: the pickup branch and day, the order's lines priced from the latest
 * menu, the total and Go to checkout. Changing branch asks first (AC-C2).
 */
export function CartScreen() {
  const page = useCartPage();
  const { cart, branch, date, branchesQuery, menuQuery, menu } = page;

  const idPrefix = useId();
  const nameId = useCallback((productId: ProductId) => `${idPrefix}-line-${productId}`, [idPrefix]);
  const emptyTitleId = `${idPrefix}-empty`;
  const noticesRef = useRef<HTMLDivElement>(null);
  const focusRequest = useRef<FocusRequest | null>(null);

  // Runs after every render: settles a pending focus move once its target is on screen.
  useEffect(() => {
    const request = focusRequest.current;
    if (!request) return;
    const target =
      request.kind === "notices"
        ? noticesRef.current
        : document.getElementById(request.kind === "line" ? nameId(request.id) : emptyTitleId);
    if (!target) return;
    focusRequest.current = null;
    focusWithoutTabStop(target);
  });

  const change = useChangeBranch({
    current: branch,
    branches: page.branches,
    onChanged: useCallback((told: boolean) => {
      // Otherwise focus stays on the Change button the sheet or dialog gave it back to.
      if (told) focusRequest.current = { kind: "notices" };
    }, []),
  });

  const changeQuantity = (product: MenuProduct, quantity: number) => {
    if (quantity === 0) {
      // The stepper that has focus is about to go: move to the next line, else the previous, else the empty state.
      const index = page.lines.findIndex((line) => line.product.id === product.id);
      const neighbour = page.lines[index + 1] ?? page.lines[index - 1];
      focusRequest.current = neighbour ? { kind: "line", id: neighbour.product.id } : { kind: "empty" };
    }
    page.changeQuantity(product, quantity);
  };

  const backHref = branch && date ? routes.menu(branch.id, date) : routes.home;
  const loading = !page.cartReady || branchesQuery.isPending;
  const hasItems = cartCount(cart) > 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* -ml-2: the quiet button's text lines up with the design's 8px header inset. */}
      <ButtonLink href={backHref} variant="quiet" icon="left" className="-ml-2 self-start">
        {content.back}
      </ButtonLink>
      <h1 className="page-title">{content.title}</h1>

      {loading && !branchesQuery.isError && <LoadingMessage>{content.loading}</LoadingMessage>}
      {branchesQuery.isError && (
        <LoadErrorNotice retryLabel={content.retry} onRetry={page.retry} retrying={branchesQuery.isFetching}>
          {content.loadError}
        </LoadErrorNotice>
      )}

      {!loading && branchesQuery.isSuccess && (!cart || !branch || !date) && (
        <CartEmptyState place={null} titleId={emptyTitleId} />
      )}

      {cart && branch && date && (
        <>
          <CartPickupCard branch={branch} date={date} onChangeBranch={change.open} />

          {(page.storageProblem || page.messages.length > 0) && (
            <div ref={noticesRef} className="flex flex-col gap-3 focus-visible:shadow-none">
              {page.storageProblem && (
                <Notice onDismiss={page.dismissStorageProblem}>
                  {cartContent.storage[page.storageProblem]}
                </Notice>
              )}
              {page.messages.length > 0 && (
                <Notice onDismiss={page.dismissMessages}>
                  {page.messages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </Notice>
              )}
            </div>
          )}

          {!hasItems ? (
            <CartEmptyState
              place={{ branchId: branch.id, branchName: branch.name, date }}
              titleId={emptyTitleId}
            />
          ) : (
            <>
              {menuQuery.isError && (
                <LoadErrorNotice retryLabel={content.retry} onRetry={page.retry} retrying={menuQuery.isFetching}>
                  {content.loadError}
                </LoadErrorNotice>
              )}
              {menuQuery.isPending && !menuQuery.isError && <LoadingMessage>{content.loading}</LoadingMessage>}
              {menu && !page.menuIsCurrent && !menuQuery.isError && (
                <LoadingMessage>{content.checking(formatPickupDay(date))}</LoadingMessage>
              )}
              {page.lines.length > 0 && (
                // While the prices reload (or failed), the old ones stay visible but can't be used.
                <div inert={!page.menuIsCurrent} aria-busy={!page.menuIsCurrent} className="flex flex-col gap-6">
                  <CartLines lines={page.lines} onQuantityChange={changeQuantity} nameId={nameId} />
                  <ButtonLink href={backHref} icon="plus" block>
                    {cartContent.lines.addMore}
                  </ButtonLink>
                </div>
              )}
            </>
          )}

          {page.summary.count > 0 && (
            <CartTotalBar count={page.summary.count} totalCents={page.summary.totalCents} />
          )}

          {page.branches && change.pendingBranch && (
            <ChangeBranchSheet
              open={change.view === "sheet"}
              branches={page.branches}
              current={branch}
              pending={change.pendingBranch}
              checking={change.checking}
              failed={change.failed}
              onChoose={change.choose}
              onConfirm={() => void change.confirmSheet()}
              onCancel={change.close}
            />
          )}
          <BranchChangeWarning
            open={change.view === "warning"}
            target={change.target}
            currentName={branch.name}
            onConfirm={change.confirmWarning}
            onKeep={change.close}
          />
        </>
      )}
    </div>
  );
}
