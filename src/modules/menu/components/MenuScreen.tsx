"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { useBranchesQuery } from "@/modules/branches/hooks/useBranchesQuery";
import { cartContent } from "@/modules/cart/content/cartContent";
import { cartSummary, quantityOf } from "@/modules/cart/lib/cartLogic";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import type { BranchId, ProductId } from "@/shared/domain";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { menuContent } from "../content/menuContent";
import { useMenuOrder } from "../hooks/useMenuOrder";
import { CategoryNav } from "./CategoryNav";
import { MenuSections } from "./MenuSections";
import { OrderBar } from "./OrderBar";
import { PickupCard } from "./PickupCard";
import { ProductSheet } from "./ProductSheet";

const content = menuContent;

/** C2: pickup branch and day, the notices, the menu by category and the order bar. */
export function MenuScreen({ branchId }: { branchId: BranchId }) {
  const branchesQuery = useBranchesQuery();
  const branch = branchesQuery.data?.branches.find((b) => b.id === branchId);
  if (branchesQuery.isSuccess && !branch) notFound();

  const order = useMenuOrder(branchId, branch);
  const { menuQuery, date, cart } = order;
  const menu = menuQuery.data;
  const [detailId, setDetailId] = useState<ProductId | null>(null);

  const products = menu?.categories.flatMap((c) => c.products) ?? [];
  const detail = products.find((p) => p.id === detailId);
  const summary = cartSummary(cart, order.menuIsCurrent ? menu : undefined);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="page-title">{content.title}</h1>

      {branchesQuery.isError && (
        <LoadErrorNotice
          retryLabel={content.retry}
          onRetry={() => void branchesQuery.refetch()}
          retrying={branchesQuery.isFetching}
        >
          {content.loadError}
        </LoadErrorNotice>
      )}
      {branchesQuery.isPending && <LoadingMessage>{content.loading}</LoadingMessage>}

      {branch && <PickupCard branch={branch} date={date} onPickDate={order.pickDate} />}

      {order.storageProblem && (
        <Notice onDismiss={order.dismissStorageProblem}>
          {cartContent.storage[order.storageProblem]}
        </Notice>
      )}
      {order.messages.length > 0 && (
        <Notice onDismiss={order.dismissMessages}>
          {order.messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Notice>
      )}

      {/* Also when another day's menu is still showing: it stays unusable until this one loads. */}
      {menuQuery.isError && (
        <LoadErrorNotice
          retryLabel={content.retry}
          onRetry={() => void menuQuery.refetch()}
          retrying={menuQuery.isFetching}
        >
          {content.loadError}
        </LoadErrorNotice>
      )}
      {branch && menuQuery.isPending && !menuQuery.isError && (
        <LoadingMessage>{content.loading}</LoadingMessage>
      )}
      {menu && date && !order.menuIsCurrent && !menuQuery.isError && (
        <LoadingMessage>{content.checking(formatPickupDay(date))}</LoadingMessage>
      )}

      {menu && date && (
        // While another day's menu loads, the previous one stays visible but
        // can't be used, so nothing is added against the wrong sold-out list.
        <div
          inert={!order.menuIsCurrent}
          aria-busy={!order.menuIsCurrent}
          className="flex flex-col gap-6"
        >
          {menu.categories.length === 0 ? (
            <p>{content.empty}</p>
          ) : (
            <>
              <CategoryNav categories={menu.categories} />
              <MenuSections
                categories={menu.categories}
                date={menu.date}
                cart={cart}
                onQuantityChange={order.changeQuantity}
                onOpenDetails={(product) => setDetailId(product.id)}
              />
            </>
          )}
        </div>
      )}

      {summary.count > 0 && date && (
        <OrderBar count={summary.count} totalCents={summary.totalCents} date={date} />
      )}

      {detail && menu && (
        <ProductSheet
          key={detail.id}
          product={detail}
          date={menu.date}
          inCart={quantityOf(cart, detail.id)}
          onSave={(quantity) => order.changeQuantity(detail, quantity)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
